import asyncio
import logging
import httpx

from app.services.supabase_client import get_supabase_client
from app.core.profiler import DataProfiler

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

            # Download file from storage
            # Note: In production, we'd download the actual file here
            # For now, use demo profile
            logger.info(f"Would download file from: {file_path}")

            # Create profiler
            profiler = DataProfiler()

            # Update progress
            supabase.table("jobs").update({"progress": 50}).eq("id", job_id).execute()

            # Generate profile (demo for now)
            profile_data = profiler.create_demo_profile()

            # Update progress
            supabase.table("jobs").update({"progress": 80}).eq("id", job_id).execute()

            # Store profile
            supabase.table("dataset_profiles").insert({
                "dataset_version_id": version_id,
                "user_id": user_id,
                "profile_json": profile_data,
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
