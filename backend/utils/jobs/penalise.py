import logging
from datetime import datetime, timedelta, timezone, date
from sqlalchemy.orm import Session

from utils.database import redis_database, pg_database
from models import redis_models
from utils.general.history_logger import log_history, HistoryType
from utils.operations.crud_func import get_all_players 
from routers.players import get_all_redis 

logger = logging.getLogger(__name__)


def calculateNextDueDate(
    start_date: date, occurence: redis_models.Occurence, x_occurence: int
) -> date:
    next_due = datetime.combine(start_date, datetime.min.time())

    if occurence == redis_models.Occurence.DAYS:
        next_due += timedelta(days=x_occurence)
    elif occurence == redis_models.Occurence.WEEKS:
        next_due += timedelta(weeks=x_occurence)
    elif occurence == redis_models.Occurence.MONTHS:
        next_due += timedelta(days=x_occurence * 30)
    else:
        logger.error(f"Unknown occurence type encountered: {occurence}")
        raise ValueError(f"Unsupported occurrence type: {occurence}")
    next_due -= timedelta(days=1)
    return next_due.date()


async def check_overdue_and_penalize():
    logger.info(f"Running check & penalize job at {datetime.now(timezone.utc)}")
    r = await redis_database.get_redis_connection()
    try:
        all_players = await get_all_players(r)
        today = datetime.now().date()

        for player in all_players:
            total_penalty = 0
            current_aura = player.aura

            habits, tasks, routines = await get_all_redis(r, player.username)

            for task in tasks:
                if not task.completed and task.due_date < today:
                    total_penalty += 2

            for routine in routines:
                next_due_date_str = calculateNextDueDate(
                    routine.start_date,
                    routine.occurence,
                    routine.x_occurence,
                )
                if next_due_date_str < today:
                    penalty = int(routine.aura / 2)
                    total_penalty += penalty

            if total_penalty > 0:
                new_aura = max(0, current_aura - total_penalty)
                await redis_database.redis_update(
                    r,
                    f"player:{player.username}",
                    {"aura": new_aura},
                    redis_models.Player,
                )
                logger.info(
                    f"Aura penalized by {total_penalty} for overdue/incomplete items. New aura: {new_aura}"
                )
                pg_db: Session = pg_database.SessionLocal()
                log_history(
                    db=pg_db,
                    user_id=player.username,
                    history_type=HistoryType.PLAYER,
                    data=player,
                    comments=f"Aura penalized by {total_penalty} for overdue/incomplete items. New aura: {new_aura}",
                )
                pg_db.close()

    except Exception as e:
        logger.error(f"Penalize Job: Error during run: {e}", exc_info=True)
    finally:
        pass
