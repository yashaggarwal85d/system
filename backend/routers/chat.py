import logging
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
import logging
import redis.asyncio as redis

from models.chat_models import ChatHistoryEntry
from routers import players
from utils.ai import gemini, prompts, data_format
from utils.ai.handle_ai_action import handle_create_action, handle_edit_action
from utils.database import pg_database, redis_database
from models import pg_models, redis_models
from utils.operations import auth
from models.pg_models import ChatHistory
from models.chat_models import *
from utils.operations.crud_func import get_player_history_records


logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/chat/history", response_model=List[ChatHistoryEntry])
async def get_chat_history(
    current_user: redis_models.Player = Depends(auth.get_current_user),
    pg_db: Session = Depends(pg_database.get_pg_db),
):
    try:
        history_records = (
            pg_db.query(pg_models.ChatHistory)
            .filter(pg_models.ChatHistory.user_id == current_user.username)
            .order_by(pg_models.ChatHistory.timestamp.asc())
            .all()
        )
        history_response = []
        for record in history_records:
            history_response.append(
                ChatHistoryEntry(
                    role=record.role,
                    content=record.content,
                    timestamp=record.timestamp.isoformat(),
                )
            )
        return history_response
    except Exception as e:
        logger.error(
            f"Error fetching chat history for user {current_user.username}: {e}",
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Failed to fetch chat history.")


async def get_gemini_history(
    current_user: redis_models.Player, pg_db: Session, prompt: str
):
    chat_history = await get_chat_history(current_user, pg_db)
    gemini_api_history = [{"role": "user", "parts": [{"text": prompt}]}]

    for item in chat_history:
        content = {"action": "response", "details": {"message": item.content}}
        api_role = "model" if item.role == "assistant" else item.role
        gemini_api_history.append({"role": api_role, "parts": [{"text": str(content)}]})
    return gemini_api_history


@router.post("/chat", response_model=ChatResponse)
async def handle_chat_message(
    user_message: str,
    current_user: redis_models.Player = Depends(auth.get_current_user),
    db: redis.Redis = Depends(redis_database.get_redis_connection),
    pg_db: Session = Depends(pg_database.get_pg_db),
):
    try:
        gemini_model = gemini.get_gemini_model()

        player = await redis_database.redis_get(
            db, f"player:{current_user.username}", redis_models.Player
        )
        habits, tasks, routines = await players.get_all_redis(db, current_user.username)
        history = await get_player_history_records(current_user.username, pg_db)

        base_prompt = data_format.get_base_formatted_data(
            player, habits, tasks, routines, history
        )
        full_user_prompt = prompts.get_chat_prompt(base_prompt, player.mentor)
        gemini_api_history: list = await get_gemini_history(
            current_user, pg_db, full_user_prompt
        )
        logger.info(
            f"Sending request to Gemini chat for user {current_user.username}..."
        )
        chat_session = gemini_model.start_chat(history=gemini_api_history)
        response = await chat_session.send_message_async(
            user_message
            + ". Always respond in a valid JSON format as specified in the instructions in the start of the conversation."
        )
        parsed_response = data_format.parseResponseToJson(response.text)
        if "action" in parsed_response:
            action_type = parsed_response.get("action")
            entity_type = parsed_response.get("type")
            details = parsed_response.get("details")

            if (
                action_type == "create"
                and entity_type in ["task", "habit", "routine"]
                and details
            ):
                success, message_or_entity = await handle_create_action(
                    db, pg_db, current_user.username, entity_type, details
                )
                if success:
                    entity_name = getattr(message_or_entity, "name", "")
                    ai_reply = f"Okay, I've created the {entity_type}: '{entity_name}'."
                else:
                    ai_reply = f"Sorry, I couldn't create the {entity_type}. Reason: {message_or_entity}"

            elif (
                action_type == "edit"
                and entity_type in ["task", "habit", "routine"]
                and details
            ):

                entity_list: List[Any] = []
                if entity_type == "task":
                    entity_list = tasks
                elif entity_type == "habit":
                    entity_list = habits
                elif entity_type == "routine":
                    entity_list = routines

                success, message = await handle_edit_action(
                    db,
                    pg_db,
                    current_user.username,
                    entity_type,
                    details,
                    entity_list,
                )
                if success:
                    ai_reply = f"Okay, I've updated the {entity_type} '{message}'."
                else:
                    ai_reply = (
                        f"Sorry, I couldn't update the {entity_type}, '{message}'"
                    )
            elif action_type == "response" and details["message"]:
                ai_reply = f"{details['message']}"
            else:
                ai_reply = f"I do not understand what you are asking me, its beyond my current capabilities. I can Create or Edit a Task, Habit, or Routine. I can even pull up a great analysis of you and your tasks, habits, and routines."

        else:
            ai_reply = f"My brain is not working, wait a few seconds and try again."

        ai_chat_entry = ChatHistory(
            user_id=current_user.username,
            role="assistant",
            content=ai_reply,
        )
        user_chat_entry = ChatHistory(
            user_id=current_user.username,
            role="user",
            content=user_message,
        )
        pg_db.add(user_chat_entry)
        pg_db.add(ai_chat_entry)
        pg_db.commit()
        return ChatResponse(reply=ai_reply)

    except Exception as e:
        logger.error(
            f"Error processing chat message for {current_user.username}: {e}",
            exc_info=True,
        )
        pg_db.rollback()
        raise HTTPException(
            status_code=500, detail="Internal server error processing chat message."
        )


@router.delete("/chat/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_chat_history(
    current_user: redis_models.Player = Depends(auth.get_current_user),
    pg_db: Session = Depends(pg_database.get_pg_db),
):
    try:
        deleted_count = (
            pg_db.query(pg_models.ChatHistory)
            .filter(pg_models.ChatHistory.user_id == current_user.username)
            .delete(synchronize_session=False)
        )
        pg_db.commit()
        logger.info(
            f"Cleared {deleted_count} chat history records for user {current_user.username}"
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        logger.error(
            f"Error clearing chat history for user {current_user.username}: {e}",
            exc_info=True,
        )
        pg_db.rollback()
        raise HTTPException(status_code=500, detail="Failed to clear chat history.")
