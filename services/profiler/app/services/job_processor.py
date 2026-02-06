import asyncio
import logging
import io
from datetime import datetime, timezone
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
        result = (
            supabase.table("jobs")
            .select("*")
            .eq("status", "queued")
            .eq("job_type", "profile")
            .limit(5)
            .execute()
        )

        if not result.data:
            return

        logger.info(f"Found {len(result.data)} pending jobs")

        for job in result.data:
            await self.process_job(job)

    async def process_job(self, job: dict):
        """Process a single profiling job."""
        job_id = job["id"]
        payload = job.get("payload") or {}
        version_id = payload.get("version_id")
        if not version_id:
            supabase = get_supabase_client()
            supabase.table("jobs").update({
                "status": "failed",
                "error_message": "Missing version_id in job payload",
                "progress": 100,
            }).eq("id", job_id).execute()
            return

        supabase = get_supabase_client()
        version_result = (
            supabase.table("dataset_versions")
            .select("*, dataset:datasets(*, project:projects(*))")
            .eq("id", version_id)
            .single()
            .execute()
        )
        version = version_result.data
        if not version:
            supabase.table("jobs").update({
                "status": "failed",
                "error_message": "Dataset version not found",
                "progress": 100,
            }).eq("id", job_id).execute()
            return

        dataset = version.get("dataset") or {}
        file_path = version.get("storage_path")
        file_type = dataset.get("file_type", "")
        dataset_name = dataset.get("name") or "Dataset"

        logger.info(f"Processing job {job_id} for dataset version {version_id}")

        try:
            # Update job status to running
            supabase.table("jobs").update({
                "status": "running",
                "progress": 10,
                "started_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", job_id).execute()

            # Update version status
            supabase.table("dataset_versions").update({
                "status": "profiling"
            }).eq("id", version_id).execute()

            settings = get_settings()
            bucket = settings.supabase_datasets_bucket
            logger.info(f"Downloading file from: {bucket}/{file_path}")
            if not file_path:
                raise ValueError("Dataset version missing storage_path")
            file_bytes = supabase.storage.from_(bucket).download(file_path)
            df, sampled_input, sample_note = self._read_dataset(file_bytes, file_type)

            profiler = DataProfiler(max_sample_size=settings.max_sample_size)

            supabase.table("jobs").update({"progress": 50}).eq("id", job_id).execute()

            profile_data = profiler.profile_dataframe(df)
            if sampled_input:
                warnings = profile_data.get("warnings") or []
                warnings.append({
                    "type": "sampling",
                    "severity": "medium",
                    "message": sample_note or "Profile computed on a sample due to file size. Results are approximate.",
                })
                profile_data["warnings"] = warnings
            profile_data["dataset"] = {
                "name": dataset_name,
                "version": version.get("version_number", 1),
                "status": "ready",
                "uploadedAt": version.get("created_at"),
            }

            # Update progress
            supabase.table("jobs").update({"progress": 80}).eq("id", job_id).execute()

            # Store profile
            schema_info = profile_data.get("schema", {}).get("columns", [])
            statistics = profile_data.get("stats", {})
            supabase.table("dataset_profiles").upsert({
                "version_id": version_id,
                "schema_info": schema_info,
                "statistics": statistics,
                "correlations": profile_data.get("correlations"),
                "missing_values": profile_data.get("missing"),
                "warnings": profile_data.get("warnings", []),
                "sample_data": df.head(50).to_dicts(),
                "computed_at": datetime.now(timezone.utc).isoformat(),
            }, on_conflict="version_id").execute()

            # Update dataset version
            supabase.table("dataset_versions").update({
                "status": "ready",
                "row_count": statistics.get("row_count"),
                "column_count": statistics.get("column_count"),
                "error_message": None,
            }).eq("id", version_id).execute()

            # Mark job complete
            supabase.table("jobs").update({
                "status": "completed",
                "progress": 100,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", job_id).execute()

            logger.info(f"Job {job_id} completed successfully")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")

            # Mark as failed
            supabase.table("jobs").update({
                "status": "failed",
                "error_message": str(e),
            }).eq("id", job_id).execute()

            supabase.table("dataset_versions").update({
                "status": "error",
                "error_message": str(e),
            }).eq("id", version_id).execute()

    def stop(self):
        """Stop the polling loop."""
        self.running = False

    def _read_dataset(self, file_bytes: bytes, file_type: str) -> tuple[pl.DataFrame, bool, str | None]:
        file_type = (file_type or "").lower()
        if "/" in file_type:
            file_type = file_type.split("/")[-1]
        buffer = io.BytesIO(file_bytes)
        settings = get_settings()
        max_file_size_bytes = settings.max_file_size_mb * 1024 * 1024
        is_large = len(file_bytes) > max_file_size_bytes
        head_rows = settings.head_sample_size
        sample_note = None
        if file_type in ["csv", "txt"]:
            if is_large:
                sample_note = f"Profile computed on first {head_rows} rows (file size exceeds {settings.max_file_size_mb}MB)."
                return pl.read_csv(buffer, n_rows=head_rows, infer_schema_length=1000, try_parse_dates=True, ignore_errors=True), True, sample_note
            return pl.read_csv(buffer, infer_schema_length=1000, try_parse_dates=True, ignore_errors=True), False, None
        if file_type in ["tsv"]:
            if is_large:
                sample_note = f"Profile computed on first {head_rows} rows (file size exceeds {settings.max_file_size_mb}MB)."
                return pl.read_csv(buffer, separator="\t", n_rows=head_rows, infer_schema_length=1000, try_parse_dates=True, ignore_errors=True), True, sample_note
            return pl.read_csv(buffer, separator="\t", infer_schema_length=1000, try_parse_dates=True, ignore_errors=True), False, None
        if file_type in ["json", "ndjson"]:
            if is_large:
                sample_note = f"Profile computed on first {head_rows} rows (file size exceeds {settings.max_file_size_mb}MB)."
                return pl.read_json(buffer, n_rows=head_rows), True, sample_note
            return pl.read_json(buffer), False, None
        if file_type in ["parquet"]:
            if is_large:
                sample_note = f"Profile computed on first {head_rows} rows (file size exceeds {settings.max_file_size_mb}MB)."
                try:
                    return pl.read_parquet(buffer, n_rows=head_rows), True, sample_note
                except TypeError:
                    # Fallback for older polars without n_rows support
                    return pl.read_parquet(buffer).head(head_rows), True, sample_note
            return pl.read_parquet(buffer), False, None
        if file_type in ["xlsx", "xls"]:
            import pandas as pd
            if is_large:
                sample_note = f"Profile computed on first {head_rows} rows (file size exceeds {settings.max_file_size_mb}MB)."
                pdf = pd.read_excel(buffer, nrows=head_rows)
                return pl.from_pandas(pdf), True, sample_note
            pdf = pd.read_excel(buffer)
            return pl.from_pandas(pdf), False, None
        raise ValueError(f"Unsupported file type: {file_type}")
