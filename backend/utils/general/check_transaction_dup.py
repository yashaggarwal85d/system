from sqlalchemy import Transaction
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models.pg_models import Transaction


def is_duplicate_transaction(user_id: str, raw_data_hash: str, db: Session) -> bool:
    try:
        existing_transaction = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == user_id,
                Transaction.raw_data_hash == raw_data_hash,
            )
            .first()
        )
        return existing_transaction is not None
    except SQLAlchemyError as e:
        return False


def add_transaction(
    transaction_data: Dict[str, Any],
    user_id: str,
    raw_data_hash: str,
    db: Session,
) -> Optional[Transaction]:
    if is_duplicate_transaction(user_id, raw_data_hash, db):
        return None

    try:
        new_transaction = Transaction(
            user_id=user_id,
            raw_data_hash=raw_data_hash,
            transaction_date=transaction_data.get("transaction_date"),
            description=transaction_data.get("description"),
            amount=transaction_data.get("amount"),
            category=transaction_data.get("category"),
            is_credit=transaction_data.get("is_credit", False),
            currency=transaction_data.get("currency"),
        )
        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)
        return new_transaction
    except SQLAlchemyError as e:
        db.rollback()
        return None
    except Exception as e:
        db.rollback()
        return None
