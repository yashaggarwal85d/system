import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch



from backend.main import app
from backend import models, auth, database



@pytest.fixture(scope="session")
def client():
    """
    Provides a FastAPI TestClient instance for making requests to the app.
    """
    with TestClient(app) as c:
        yield c



@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    """
    Automatically mocks Redis interactions for all tests.
    Uses monkeypatch to replace database functions with AsyncMocks.
    """
    mock_conn = AsyncMock() 

    
    monkeypatch.setattr(database, "get_redis_connection", AsyncMock(return_value=mock_conn))
    monkeypatch.setattr(database, "redis_set", AsyncMock(return_value=True)) 
    monkeypatch.setattr(database, "redis_get", AsyncMock(return_value=None)) 
    monkeypatch.setattr(database, "redis_delete", AsyncMock(return_value=0)) 
    monkeypatch.setattr(database, "redis_update", AsyncMock(return_value=None)) 
    monkeypatch.setattr(database, "redis_get_all_by_prefix", AsyncMock(return_value=[])) 

    
    

    
    return {
        "connection": mock_conn,
        "get_connection": database.get_redis_connection,
        "set": database.redis_set,
        "get": database.redis_get,
        "delete": database.redis_delete,
        "update": database.redis_update,
        "get_all": database.redis_get_all_by_prefix,
    }


@pytest.fixture
def mock_auth(monkeypatch):
    """
    Mocks the authentication dependency (get_current_user).
    """
    
    mock_get_user = MagicMock(return_value=auth.TokenData(username="testuser"))
    monkeypatch.setattr(auth, "get_current_user", mock_get_user)
    return mock_get_user 


@pytest.fixture
def authenticated_client(client: TestClient, test_user_username):
    """
    Provides a TestClient instance where the auth dependency is overridden.
    """
    
    async def override_get_current_user():
        return auth.TokenData(username=test_user_username)

    
    original_override = app.dependency_overrides.get(auth.get_current_user)

    
    app.dependency_overrides[auth.get_current_user] = override_get_current_user

    yield client 

    
    if original_override:
        app.dependency_overrides[auth.get_current_user] = original_override
    else:
        
        app.dependency_overrides.pop(auth.get_current_user, None)




@pytest.fixture
def test_user_username() -> str:
    """Provides the username used in mocked authentication."""
    return "testuser"

@pytest.fixture
def test_player_data(test_user_username) -> models.Player:
    """Provides sample valid player data for creation/testing."""
    return models.Player(
        username=test_user_username,
        password="testpassword", 
        level=1,
        aura=100,
        description="A test player"
    )

@pytest.fixture
def test_habit_data(test_user_username) -> models.Habit:
    """Provides sample valid habit data."""
    return models.Habit(
        id="habit123",
        userId=test_user_username,
        name="Test Habit",
        aura=10,
        start_date="2025-04-04", 
        last_completed="2025-04-04", 
        occurence=models.Occurence.DAYS,
        x_occurence=1,
    )

@pytest.fixture
def test_task_data(test_user_username) -> models.Task:
    """Provides sample valid task data."""
    return models.Task(
        id="task123",
        userId=test_user_username,
        name="Test Task",
        due_date="2025-04-10", 
        aura=5, 
    )

@pytest.fixture
def test_routine_data(test_user_username) -> models.Routine:
    """Provides sample valid routine data."""
    return models.Routine(
        id="routine123",
        userId=test_user_username,
        name="Test Routine",
        aura=20,
        start_date="2025-04-04", 
        last_completed="2025-04-04", 
        occurence=models.Occurence.WEEKS,
        x_occurence=1,
        checklist="[ ] Item 1\n[ ] Item 2"
    )
