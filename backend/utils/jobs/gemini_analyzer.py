import logging
from typing import List
import uuid
import redis.asyncio as redis
from sqlalchemy.orm import Session

from routers.tasks import task_key
from utils.operations.crud_func import get_all_players 
from routers.players import get_all_redis 
from utils.database import pg_database, redis_database
from utils.operations.crud_obj import generic_create_item
from utils.ai.gemini import get_gemini_model
from utils.ai.prompts import get_daily_summary_prompt
from utils.ai.data_format import get_base_formatted_data, parseResponseToJson
from models import redis_models

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def analyze_player_data(
    player: redis_models.Player, db: redis.Redis, pg_db: Session
):
    gemini_model = get_gemini_model()
    logger.info(f"Starting analysis for player: {player.username}")

    try:
        habits, tasks, routines = await get_all_redis(db, player.username)
        base_prompt = get_base_formatted_data(
            player, habits, tasks, routines
        )
        prompt = get_daily_summary_prompt(base_prompt, player.mentor)
        response = await gemini_model.generate_content_async(prompt)
        analysis_result = parseResponseToJson(response.text)
        item_descriptions: dict = analysis_result.get("item_descriptions", {})
        player_summary: dict = analysis_result.get("ai_player_summary", None)

        for task in tasks:
            key = f"task:{player.username}:{task.id}"
            desc = item_descriptions.get(f"task:{task.id}")
            if desc:
                await redis_database.redis_update(
                    db, key, {"description": desc}, redis_models.Task
                )

        for habit in habits:
            key = f"habit:{player.username}:{habit.id}"
            desc = item_descriptions.get(f"habit:{habit.id}")
            if desc:
                await redis_database.redis_update(
                    db, key, {"description": desc}, redis_models.Habit
                )

        for routine in routines:
            key = f"routine:{player.username}:{routine.id}"
            desc = item_descriptions.get(f"routine:{routine.id}")
            if desc:
                await redis_database.redis_update(
                    db, key, {"description": desc}, redis_models.Routine
                )
        if player_summary:
            key = f"player:{player.username}"
            await redis_database.redis_update(
                db, key, {"description": str(player_summary).replace(".", ",")}, redis_models.Player
            )

        challenge_task_data: dict = analysis_result.get("challenge_task", None)
        await prepare_challenge_task(player.username, challenge_task_data, db)

    except Exception as e:
        logger.error(
            f"An unexpected error occurred during analysis for player {player.username}: {e}",
            exc_info=True,
        )

async def prepare_challenge_task(
    username: str, challenge_task_data: dict, db: redis.Redis
):
    if challenge_task_data and isinstance(challenge_task_data, dict):
        try:
            new_task_id = str(uuid.uuid4())
            task_name = challenge_task_data.get("name")
            due_date = challenge_task_data.get("due_date")
            if not task_name or not due_date:
                return
            task_desc = challenge_task_data.get(
                "description", "Complete this and bag that extra aura"
            )
            task_aura = challenge_task_data.get("aura", 10)
            new_task = redis_models.Task(
                id=new_task_id,
                userId=username,
                name=f"✨ AI Challenge: {task_name}",
                description=task_desc,
                due_date=due_date,
                aura=task_aura,
                completed=False,
            )
            await generic_create_item(
                item_data=new_task,
                current_username=username,
                db=db,
                key_func=task_key,
                model_class=redis_models.Task,
            )
            logger.info(
                f"Prepared AI challenge task '{new_task.name}' for player {username} using generic_create_item."
            )

        except Exception as e:
            logger.error(
                f"Failed to create challenge task object for player {username}: {e}",
                exc_info=True,
            )
    else:
        logger.warning(
            f"No valid challenge task data received from Gemini for player {username}."
        )


async def run_daily_analysis_job():
    logger.info("Starting daily Gemini analysis job...")
    try:

        async with await redis_database.get_redis_connection() as redis_conn:
            pg_session_local = pg_database.SessionLocal()
            try:
                players: List[redis_models.Player] = await get_all_players(redis_conn)
                for player in players:
                    await analyze_player_data(player, redis_conn, pg_session_local)
            finally:
                logger.info("Daily Gemini analysis job finished.")
                pg_session_local.close()

    except Exception as e:
        logger.error(
            f"An error occurred during the daily Gemini analysis job: {e}",
            exc_info=True,
        )
