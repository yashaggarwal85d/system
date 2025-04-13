import logging
from datetime import datetime, timezone, date
from .. import models
from ..models import validate_date_format 
from ..utils.check_next_due import calculateNextDueDate
from ..utils import database

logger = logging.getLogger(__name__)

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

        today = datetime.now(timezone.utc).date()

        for player in all_players:
            total_penalty = 0
            player_key = f"player:{player.username}"
            current_aura = player.aura

            
            task_pattern = f"task:{player.username}:*" 
            player_tasks = await database.redis_get_all_by_prefix(
                r, task_pattern, models.Task
            )
            for task in player_tasks:
                if task.userId != player.username:
                     logger.warning(
                         f"Task {task.id} retrieved for user {player.username} but has userId {task.userId}"
                     )
                     continue
                if (
                    not task.completed
                    and isinstance(task.due_date, date)
                    and task.due_date < today
                ):
                    logger.info(
                        f"Task '{task.name}' for player '{player.username}' is incomplete and overdue (Due: {task.due_date}). Adding penalty."
                    )
                    total_penalty += 2

            
            routine_pattern = f"routine:{player.username}:*" 
            player_routines = await database.redis_get_all_by_prefix(
                r, routine_pattern, models.Routine
            )
            for routine in player_routines:
                if routine.userId != player.username:
                    logger.warning(
                        f"Routine {routine.id} retrieved for user {player.username} but has userId {routine.userId}"
                    )
                    continue
                try:
                    start_date_str = routine.start_date.strftime("%d-%m-%y") if isinstance(routine.start_date, date) else routine.start_date
                    next_due_date_str = calculateNextDueDate(
                        start_date_str,
                        routine.occurence,
                        routine.x_occurence,
                    )
                    next_due_date = validate_date_format(next_due_date_str)
                    if isinstance(next_due_date, date) and next_due_date < today:
                        logger.info(
                            f"Routine '{routine.name}' for player '{player.username}' is overdue (Next Due: {next_due_date_str}). Adding penalty."
                        )
                        total_penalty += 5
                except Exception as calc_err:
                    logger.error(
                        f"Error calculating next due date for routine {routine.id} ({routine.name}): {calc_err}",
                        exc_info=True,
                    )

            
            habit_pattern = f"habit:{player.username}:*" 
            player_habits = await database.redis_get_all_by_prefix(
                r, habit_pattern, models.Habit
            )
            for habit in player_habits:
                if habit.userId != player.username:
                    logger.warning(
                        f"Habit {habit.id} retrieved for user {player.username} but has userId {habit.userId}"
                    )
                    continue
                try:
                    start_date_str_h = habit.start_date.strftime("%d-%m-%y") if isinstance(habit.start_date, date) else habit.start_date
                    next_due_date_str_h = calculateNextDueDate(
                        start_date_str_h,
                        habit.occurence,
                        habit.x_occurence,
                    )
                    next_due_date_h = validate_date_format(next_due_date_str_h)
                    if isinstance(next_due_date_h, date) and next_due_date_h < today:
                        logger.info(
                            f"Habit '{habit.name}' for player '{player.username}' is overdue (Next Due: {next_due_date_str_h}). Adding penalty."
                        )
                        total_penalty += 3
                except Exception as calc_err_h:
                    logger.error(
                        f"Error calculating next due date for habit {habit.id} ({habit.name}): {calc_err_h}",
                        exc_info=True,
                    )

            
            if total_penalty > 0:
                new_aura = max(0, current_aura - total_penalty)
                if new_aura < current_aura:
                    logger.info(
                        f"Penalizing player '{player.username}' by {total_penalty}. Aura: {current_aura} -> {new_aura}"
                    )
                    await database.redis_update(
                        r, player_key, {"aura": new_aura}, models.Player
                    )
                else:
                    logger.info(
                        f"Player '{player.username}' already at minimum aura or penalty ({total_penalty}) resulted in no change."
                    )

    except Exception as e:
        logger.error(f"Penalize Job: Error during run: {e}", exc_info=True)
    finally:
        pass

    logger.info(f"Finished check & penalize run at {datetime.now(timezone.utc)}")
