from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import logging

from utils.general.get_env import getenv

logger = logging.getLogger(__name__)

try:
    engine = create_engine(getenv("POSTGRES_URL"), pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("PostgreSQL engine and session created successfully.")
except Exception as e:
    logger.error(f"Failed to create PostgreSQL engine or session: {e}", exc_info=True)
    raise Exception(f"Failed to create PostgreSQL engine or session: {e}")


def get_pg_db() -> Session: # type: ignore
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_pg_connection():
    try:
        connection = engine.connect()
        connection.close()
        logger.info("Successfully connected to the PostgreSQL database.")
        return True
    except Exception as e:
        logger.error(
            f"Failed to connect to the PostgreSQL database: {e}", exc_info=True
        )
        return False