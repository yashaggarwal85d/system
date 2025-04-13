import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from ..jobs import neural_vault_cache,penalise

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="UTC")

def start_scheduler():
    """Adds scheduled jobs and starts the scheduler."""
    try:

        if scheduler.get_job("overdue_check_job"):
            logger.info("Overdue check job already scheduled.")
        else:

            scheduler.add_job(
                penalise.check_overdue_and_penalize,
                "interval",
                hours=3,
                id="overdue_check_job",
                name="Check for overdue items and penalize aura",
                replace_existing=True,
            )
            logger.info("Overdue check job added (runs every 3 hours).")

        if scheduler.get_job("daily_cache_update"):
            logger.info("Daily cache update job already scheduled.")
        else:
            scheduler.add_job(
                neural_vault_cache.update_cache_async,
                trigger=CronTrigger(hour=11, minute=0, timezone="UTC"),
                id="daily_cache_update",
                name="Update Neural Vault cache daily",
                replace_existing=True,
            )
            logger.info("Daily cache update job added (runs daily at 11:00 AM UTC).")

        if not scheduler.running:
            scheduler.start()
            logger.info("Scheduler started.")
        else:
            logger.info("Scheduler already running.")
    except Exception as e:
        logger.error(f"Scheduler: Failed to start or add job: {e}", exc_info=True)


def stop_scheduler():
    """Stops the scheduler gracefully."""
    if scheduler.running:
        logger.info("Scheduler shutting down...")
        try:
            scheduler.shutdown(wait=False)
            logger.info("Scheduler shutdown initiated.")
        except Exception as e:
            logger.error(f"Scheduler: Error during shutdown: {e}", exc_info=True)
    else:
        logger.info("Scheduler not running.")
