import logging
from datetime import datetime, date, timedelta
from .. import models
from ..models import validate_date_format

logger = logging.getLogger(__name__)

def calculateNextDueDate(
    start_date_str: str, occurence: models.Occurence, x_occurence: int
) -> str:
    """Calculates the next due date based on start/last completed date and frequency."""
    start_date = validate_date_format(start_date_str)
    if not isinstance(start_date, date):
        logger.error(
            f"Invalid date format passed to calculateNextDueDate: {start_date_str}"
        )
        raise ValueError(f"Invalid date format for calculation: {start_date_str}")

    next_due = datetime.combine(start_date, datetime.min.time())

    if occurence == models.Occurence.DAYS:
        next_due += timedelta(days=x_occurence)
    elif occurence == models.Occurence.WEEKS:
        next_due += timedelta(weeks=x_occurence)
    elif occurence == models.Occurence.MONTHS:
        next_due += timedelta(days=x_occurence * 30)
    else:
        logger.error(f"Unknown occurence type encountered: {occurence}")
        raise ValueError(f"Unsupported occurrence type: {occurence}")

    return next_due.strftime("%d-%m-%y")
