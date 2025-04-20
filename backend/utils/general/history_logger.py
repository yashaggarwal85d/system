import logging
import json
from sqlalchemy.orm import Session
from typing import Optional, Any
from pydantic import BaseModel

from models.pg_models import History, HistoryType

logger = logging.getLogger(__name__)


def log_history(
    db: Session,
    user_id: str,
    history_type: HistoryType,
    data: Optional[Any] = None,
    comments: Optional[str] = None,
):
    json_data = None
    if data is not None:
        try:
            if isinstance(data, BaseModel):
                json_data = json.loads(data.model_dump_json())
            else:
                json_data = data
        except TypeError as e:
            logger.error(
                f"Could not serialize data for history log: {e}. Data type: {type(data)}",
                exc_info=True,
            )
            json_data = {"error": "Serialization failed", "data_repr": repr(data)}
        except Exception as e:
            logger.error(
                f"Unexpected error serializing data for history log: {e}", exc_info=True
            )
            json_data = {
                "error": "Unexpected serialization error",
                "data_repr": repr(data),
            }

    try:
        history_entry = History(
            user_id=user_id, type=history_type, data=json_data, comments=comments
        )
        db.add(history_entry)
        db.commit()
        logger.info(f"History logged for user {user_id}, type {history_type.name}")
    except Exception as e:
        logger.error(f"Failed to log history for user {user_id}: {e}", exc_info=True)
        db.rollback()
