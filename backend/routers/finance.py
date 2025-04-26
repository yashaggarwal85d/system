import logging
import hashlib
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.models.finance_models import (
    CategorizedTransactionResponse,
    FinanceDataResponse,
    GeminiResponse,
    UploadResponse,
)
from backend.utils.ai import gemini
from backend.utils.ai.data_format import parseResponseToJson
from utils.database.pg_database import get_pg_db
from utils.general.check_transaction_dup import add_transaction
from models.pg_models import Transaction as DBTransaction
from utils.operations.auth import get_current_user
from models.redis_models import Player
from utils.ai.prompts import get_finance_data_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/finance", tags=["Finance"])


def generate_hash(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


@router.post("/upload-raw", response_model=UploadResponse)
async def upload_finance_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_pg_db),
    current_user: Player = Depends(get_current_user),
):
    user_id = current_user.username
    logger.info(f"Received transaction file upload from user: {user_id}")

    try:
        contents = await file.read()
        raw_text = contents.decode("utf-8")
        await file.close()

        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        gemini_model = gemini.get_gemini_model()
        chat_session = gemini_model.start_chat()
        response = await chat_session.send_message_async(
            get_finance_data_prompt(raw_text)
        )
        response_data = parseResponseToJson(response.text)
        gemini_data = GeminiResponse.model_validate(response_data)

        added_count = 0
        skipped_count = 0
        failed_count = 0

        for tx_data in gemini_data.transactions:
            tx_data_str = tx_data.model_dump_json()
            data_hash = generate_hash(tx_data_str)

            transaction_date_obj = datetime.strptime(
                tx_data.transaction_date, "%Y-%m-%d"
            ).date()

            db_data = {
                "transaction_date": transaction_date_obj,
                "description": tx_data.description,
                "amount": tx_data.amount,
                "category": tx_data.category,
                "is_credit": tx_data.is_credit,
            }

            result = add_transaction(db_data, user_id, data_hash, db)
            if result:
                added_count += 1
            else:

                skipped_count += 1

    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))

    logger.info(
        f"File processing complete for user {user_id}. Added: {added_count}, Skipped/Duplicate: {skipped_count}, Failed: {failed_count}"
    )
    return UploadResponse(
        message="File processed.",
        added=added_count,
        skipped=skipped_count,
        failed=failed_count,
    )


@router.get("/data", response_model=FinanceDataResponse)
def get_finance_data(
    db: Session = Depends(get_pg_db),
    current_user: Player = Depends(get_current_user),
):
    user_id = current_user.username
    logger.info(f"Fetching finance data for user: {user_id}")

    try:
        db_transactions = (
            db.query(DBTransaction)
            .filter(DBTransaction.user_id == user_id)
            .order_by(DBTransaction.transaction_date.desc())
            .all()
        )

        response_transactions: List[CategorizedTransactionResponse] = []
        for tx in db_transactions:
            response_transactions.append(
                CategorizedTransactionResponse(
                    id=str(tx.id),
                    Timestamp=tx.transaction_date.strftime("%Y-%m-%d"),
                    Amount=float(tx.amount),
                    CrDr="CR" if tx.is_credit else "DR",
                    Category=tx.category or "Uncategorized",
                    Description=tx.description,
                )
            )

        logger.info(
            f"Successfully fetched {len(response_transactions)} transactions for user {user_id}"
        )
        return FinanceDataResponse(transactions=response_transactions, suggestions=[])

    except Exception as e:
        logger.error(
            f"Failed to fetch transactions for user {user_id}: {e}", exc_info=True
        )
        raise HTTPException(status_code=500, detail="Failed to fetch financial data.")
