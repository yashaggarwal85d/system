import logging
from datetime import datetime, timedelta, timezone, date
from .. import models
from ..models import validate_date_format
from ..utils import database

logger = logging.getLogger(__name__)


def calculateNextDueDate(
    start_date: date, occurence: models.Occurence, x_occurence: int
) -> str:
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

    return next_due


async def check_overdue_and_penalize():
    """
    Checks all players for incomplete/overdue tasks, routines, and habits,
    and reduces aura based on findings.
    - Tasks: Incomplete (completed=False) AND Overdue (due_date < today). Penalty: 2
    - Routines/Habits: Incomplete (last_completed <= start_date). Penalty: 5/3
    """
    logger.info(f"Running check & penalize job at {datetime.now(timezone.utc)}")
    r = await database.get_redis_connection()
    if not r:
        logger.error("Penalize Job: Failed to get Redis connection. Skipping check.")
        return
    try:
        all_players = await database.redis_get_all_by_prefix(
            r, "player:*", models.Player
        )

        today = datetime.now().date()

        for player in all_players:
            total_penalty = 0
            current_aura = player.aura

            habit_pattern = f"habit:{player.username}:*"
            player_habits = await database.redis_get_all_by_prefix(
                r, habit_pattern, models.Habit
            )
            task_pattern = f"task:{player.username}:*"
            player_tasks = await database.redis_get_all_by_prefix(
                r, task_pattern, models.Task
            )

            routine_pattern = f"routine:{player.username}:*"
            player_routines = await database.redis_get_all_by_prefix(
                r, routine_pattern, models.Routine
            )

            for task in player_tasks:
                try:
                    if not task.completed and task.due_date < today:
                        logger.info(
                            f"Task '{task.name}' for player '{player.username}' is incomplete and overdue (Due: {task.due_date}). Adding penalty."
                        )
                        total_penalty += 2
                except Exception as task_proc_err:
                    logger.error(
                        f"Error processing task {getattr(task, 'id', 'N/A')} for player {player.username}: {task_proc_err}",
                        exc_info=True,
                    )
                    continue

            for routine in player_routines:
                try:
                    next_due_date_str = calculateNextDueDate(
                        routine.start_date,
                        routine.occurence,
                        routine.x_occurence,
                    )
                    if next_due_date_str.date() < today:
                        logger.info(
                            f"Routine '{routine.name}' for player '{player.username}' is overdue (Next Due: {next_due_date_str}). Adding penalty."
                        )
                        total_penalty += 5
                except Exception as routine_proc_err:
                     logger.error(f"Error processing routine {getattr(routine, 'id', 'N/A')} for player {player.username}: {routine_proc_err}", exc_info=True)
                     continue 
            
            for habit in player_habits:
                print(habit)
                try:
                    next_due_date_str = calculateNextDueDate(
                        habit.start_date,
                        habit.occurence,
                        habit.x_occurence,
                    )
                    if next_due_date_str.date() < today:
                        logger.info(
                            f"habit '{habit.name}' for player '{player.username}' is overdue (Next Due: {next_due_date_str}). Adding penalty."
                        )
                        total_penalty += 5
                except Exception as habit_proc_err:
                     logger.error(f"Error processing habit {getattr(habit, 'id', 'N/A')} for player {player.username}: {habit_proc_err}", exc_info=True)
                     continue 

            if total_penalty > 0:
                logger.info(
                    f"Penalising this MF {player.username}, aura depleted by {total_penalty}"
                )
                await database.redis_update(
                    r,
                    f"player:{player.username}",
                    {"aura": max(0, current_aura - total_penalty)},
                    models.Player,
                )

    except Exception as e:
        logger.error(f"Penalize Job: Error during run: {e}", exc_info=True)
    finally:
        # Ensure Redis connection is closed if necessary (depends on database.py implementation)
        pass

    logger.info(f"Finished check & penalize run at {datetime.now(timezone.utc)}")
