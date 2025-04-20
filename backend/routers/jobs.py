import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
import asyncio

from utils.general.scheduler import scheduler
from utils.operations.auth import get_current_user 
from utils.jobs import penalise, gemini_analyzer
from models.redis_models import Player

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/jobs",
    tags=["jobs"],
    dependencies=[Depends(get_current_user)] 
)

JOB_FUNCTION_MAP = {
    "overdue_check_job": penalise.check_overdue_and_penalize,
    "daily_gemini_analysis": gemini_analyzer.run_daily_analysis_job,
}

@router.post("/trigger/{job_id}", status_code=status.HTTP_200_OK)
async def trigger_job_manually(job_id: str, current_user: Player = Depends(get_current_user)) -> Dict[str, str]:
    logger.info(f"Manual trigger requested for job ID: {job_id} by user {current_user.username}")
    
    job_function = JOB_FUNCTION_MAP.get(job_id)
    if not job_function:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal configuration error: No function mapped for job ID '{job_id}'."
        )
    
    job = scheduler.get_job(job_id)
    if not job:
        logger.warning(f"Manual trigger failed: Job ID '{job_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )

    try:
        if asyncio.iscoroutinefunction(job_function):
            await job_function()
        else:
             job_function() 

        logger.info(f"Job '{job_id}' executed successfully via manual trigger.")
        return {"message": f"Job '{job_id}' triggered successfully."}

    except Exception as e:
        logger.error(f"Manual trigger failed: Error executing job '{job_id}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute job '{job_id}': {str(e)}"
        )

