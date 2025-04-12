import asyncio
from datetime import datetime, timezone, date
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from . import database, models, neural_vault_cache


scheduler = AsyncIOScheduler(timezone="UTC")


async def check_overdue_and_penalize():
    """
    Checks all players for incomplete/overdue tasks, routines, and habits,
    and reduces aura by 5 for EACH item found.
    - Tasks: Incomplete (completed=False) AND Overdue (due_date < today).
    - Routines/Habits: Incomplete (last_completed <= start_date).
    """
    print(
        f"Scheduler: Running check & penalize for each incomplete item at {datetime.now(timezone.utc)}"
    )
    r = await database.get_redis_connection()
    if not r:
        print("Scheduler: Failed to get Redis connection. Skipping check.")
        return

    try:
        all_players = await database.redis_get_all_by_prefix(r, "player", models.Player)

        today = datetime.now(timezone.utc).date()

        for player in all_players:
            total_penalty = 0
            player_key = f"player:{player.username}"
            current_aura = player.aura

            all_tasks = await database.redis_get_all_by_prefix(r, "task", models.Task)
            player_tasks = [t for t in all_tasks if t.userId == player.username]
            for task in player_tasks:

                if (
                    not task.completed
                    and isinstance(task.due_date, date)
                    and task.due_date < today
                ):
                    print(
                        f"Scheduler: Task '{task.name}' for player '{player.username}' is incomplete and overdue (Due: {task.due_date}). Adding penalty."
                    )
                    total_penalty += 2

            all_routines = await database.redis_get_all_by_prefix(
                r, "routine", models.Routine
            )
            player_routines = [
                rt for rt in all_routines if rt.userId == player.username
            ]

            for routine in player_routines:

                if isinstance(routine.last_completed, date) and isinstance(
                    routine.start_date, date
                ):
                    if routine.last_completed <= routine.start_date:
                        print(
                            f"Scheduler: Routine '{routine.name}' for player '{player.username}' is incomplete (Last Completed: {routine.last_completed}, Start: {routine.start_date}). Adding penalty."
                        )
                        total_penalty += 5

                else:
                    print(
                        f"Scheduler: Warning - Invalid date types for routine '{routine.name}' for player '{player.username}'. Skipping check."
                    )

            all_habits = await database.redis_get_all_by_prefix(
                r, "habit", models.Habit
            )
            player_habits = [h for h in all_habits if h.userId == player.username]

            for habit in player_habits:

                if isinstance(habit.last_completed, date) and isinstance(
                    habit.start_date, date
                ):
                    if habit.last_completed <= habit.start_date:
                        print(
                            f"Scheduler: Habit '{habit.name}' for player '{player.username}' is incomplete (Last Completed: {habit.last_completed}, Start: {habit.start_date}). Adding penalty."
                        )
                        total_penalty += 3

                else:
                    print(
                        f"Scheduler: Warning - Invalid date types for habit '{habit.name}' for player '{player.username}'. Skipping check."
                    )

            if total_penalty > 0:
                new_aura = max(0, current_aura - total_penalty)
                if new_aura < current_aura:
                    print(
                        f"Scheduler: Penalizing player '{player.username}' by {total_penalty}. Aura: {current_aura} -> {new_aura}"
                    )
                    await database.redis_update(
                        r, player_key, {"aura": new_aura}, models.Player
                    )
                else:
                    print(
                        f"Scheduler: Player '{player.username}' already at minimum aura or penalty ({total_penalty}) resulted in no change."
                    )
            else:
                print(f"Scheduler: No penalty needed for player '{player.username}'.")

    except Exception as e:
        print(f"Scheduler: Error during overdue check: {e}")
    finally:

        pass

    print(f"Scheduler: Finished check & penalize run at {datetime.now(timezone.utc)}")


def start_scheduler():
    """Adds scheduled jobs and starts the scheduler."""
    try:

        if scheduler.get_job("overdue_check_job"):
            print("Scheduler: Overdue check job already scheduled.")
        else:
            scheduler.add_job(
                check_overdue_and_penalize,
                "interval",
                hours=3,
                id="overdue_check_job",
                name="Check for overdue items and penalize aura",
                replace_existing=True,
            )
            print("Scheduler: Overdue check job added (runs every 3 hours).")

        if scheduler.get_job("daily_cache_update"):
            print("Scheduler: Daily cache update job already scheduled.")
        else:
            scheduler.add_job(
                neural_vault_cache.update_cache,
                trigger=CronTrigger(hour=11, minute=0, timezone="UTC"),
                id="daily_cache_update",
                name="Update Neural Vault cache daily",
                replace_existing=True,
            )
            print(
                "Scheduler: Daily cache update job added (runs daily at 3:00 AM UTC)."
            )

        if not scheduler.running:
            scheduler.start()
            print("Scheduler: Started.")
        else:
            print("Scheduler: Already running.")
    except Exception as e:
        print(f"Scheduler: Failed to start or add job: {e}")


def stop_scheduler():
    """Stops the scheduler gracefully."""
    if scheduler.running:
        print("Scheduler: Shutting down...")
        try:
            scheduler.shutdown(wait=False)
            print("Scheduler: Shutdown initiated.")
        except Exception as e:
            print(f"Scheduler: Error during shutdown: {e}")
    else:
        print("Scheduler: Not running.")
