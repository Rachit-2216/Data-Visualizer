import asyncio
import logging
import io
import polars as pl

from app.services.supabase_client import get_supabase_client
from app.core.profiler import DataProfiler
from app.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JobProcessor:
    """
    Background job processor that polls the jobs table for pending work.
    """

    def __init__(self, poll_interval: int = 5):
        self.poll_interval = poll_interval
        self.running = True

    async def start_polling(self):
        """Start the polling loop."""
        logger.info("Starting job processor...")

        while self.running:
            try:
                await self.process_pending_jobs()
            except Exception as e:
                logger.error(f"Error processing jobs: {e}")

            await asyncio.sleep(self.poll_interval)

    async def process_pending_jobs(self):
        """Process all pending jobs."""
        supabase = get_supabase_client()

        # Get queued jobs
        result = supabase.table("jobs").select(
            "*, dataset_versions!inner(*)"
        ).eq("status", "queued").eq("job_type", "profile").limit(5).execute()

        if not result.data:
            return

        logger.info(f"Found {len(result.data)} pending jobs")

        for job in result.data:
            await self.process_job(job)

    async def process_job(self, job: dict):
        """Process a single profiling job."""
        job_id = job["id"]
        version = job["dataset_versions"]
        version_id = version["id"]
        user_id = version["user_id"]
        file_path = version["file_path"]
        file_type = version.get("file_type", "")

        logger.info(f"Processing job {job_id} for dataset version {version_id}")

        supabase = get_supabase_client()

        try:
            # Update job status to running
            supabase.table("jobs").update({
                "status": "running",
                "progress": 10,
            }).eq("id", job_id).execute()

            # Update version status
            supabase.table("dataset_versions").update({
                "status": "profiling"
            }).eq("id", version_id).execute()

            settings = get_settings()
            bucket = settings.supabase_datasets_bucket
            logger.info(f"Downloading file from: {bucket}/{file_path}")
            file_bytes = supabase.storage.from_(bucket).download(file_path)
            df = self._read_dataset(file_bytes, file_type)

            profiler = DataProfiler(max_sample_size=settings.max_sample_size)

            supabase.table("jobs").update({"progress": 50}).eq("id", job_id).execute()

            profile_data = profiler.profile_dataframe(df)
            dataset_record = (
                supabase.table("datasets")
                .select("name")
                .eq("id", version["dataset_id"])
                .single()
                .execute()
            )
            dataset_name = dataset_record.data["name"] if dataset_record.data else "Dataset"
            profile_data["dataset"] = {
                "name": dataset_name,
                "version": version.get("version_number", 1),
                "status": "ready",
                "uploadedAt": version.get("created_at"),
            }

            # Update progress
            supabase.table("jobs").update({"progress": 80}).eq("id", job_id).execute()

            # Store profile
            supabase.table("dataset_profiles").insert({
                "dataset_version_id": version_id,
                "user_id": user_id,
                "profile_json": profile_data,
                "sample_preview_json": df.head(50).to_dicts(),
                "warnings_json": profile_data.get("warnings", []),
            }).execute()

            # Update dataset version
            supabase.table("dataset_versions").update({
                "status": "ready",
                "row_count_est": profile_data["stats"]["row_count"],
                "column_count_est": profile_data["stats"]["column_count"],
            }).eq("id", version_id).execute()

            # Mark job complete
            supabase.table("jobs").update({
                "status": "done",
                "progress": 100,
            }).eq("id", job_id).execute()

            logger.info(f"Job {job_id} completed successfully")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")

            # Mark as failed
            supabase.table("jobs").update({
                "status": "failed",
                "error": str(e),
            }).eq("id", job_id).execute()

            supabase.table("dataset_versions").update({
                "status": "failed"
            }).eq("id", version_id).execute()

    def stop(self):
        """Stop the polling loop."""
        self.running = False

    def _read_dataset(self, file_bytes: bytes, file_type: str) -> pl.DataFrame:
        file_type = (file_type or "").lower()
        if "/" in file_type:
            file_type = file_type.split("/")[-1]
        buffer = io.BytesIO(file_bytes)
        if file_type in ["csv", "txt"]:
            return pl.read_csv(buffer)
        if file_type in ["tsv"]:
            return pl.read_csv(buffer, separator="\t")
        if file_type in ["json", "ndjson"]:
            return pl.read_json(buffer)
        if file_type in ["parquet"]:
            return pl.read_parquet(buffer)
        raise ValueError(f"Unsupported file type: {file_type}")
