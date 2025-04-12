import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from fastapi import status
from fastapi.testclient import TestClient
from backend import models
from backend.routers.habits import habit_key, user_habits_pattern

# --- Test Habit Creation ---

def test_create_habit_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test successful habit creation."""
    habit_payload = test_habit_data.model_dump()
    expected_key = habit_key(test_user_username, test_habit_data.id)

    response = authenticated_client.post("/habits/", json=habit_payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] == test_habit_data.id
    assert data["userId"] == test_user_username
    assert data["name"] == test_habit_data.name
    assert data["start_date"] == "04-04-25" # Check serialized date format
    assert data["last_completed"] == "04-04-25" # Check serialized date format
    assert data["occurence"] == test_habit_data.occurence.value
    assert data["x_occurence"] == test_habit_data.x_occurence

    # Check if redis_set was called correctly - Ensure the object passed matches the updated fixture
    # The assertion below correctly compares the passed object to the fixture object
    mock_redis["set"].assert_called_once_with(mock_redis["connection"], expected_key, test_habit_data)


def test_create_habit_for_another_user(authenticated_client: TestClient, test_habit_data, test_user_username):
    """Test attempting to create a habit for a different userId."""
    habit_payload = test_habit_data.model_copy(update={"userId": "anotheruser"}).model_dump()

    response = authenticated_client.post("/habits/", json=habit_payload)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Cannot create habit for another user" in response.json()["detail"]


# --- Test Reading Habits ---

def test_read_user_habits_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test listing all habits for the current user."""
    expected_pattern = user_habits_pattern(test_user_username)
    # Simulate redis returning a list of habits
    mock_redis["get_all"].return_value = [test_habit_data]

    response = authenticated_client.get("/habits/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    habit_in_list = data[0]
    assert habit_in_list["id"] == test_habit_data.id
    assert habit_in_list["userId"] == test_user_username
    assert habit_in_list["name"] == test_habit_data.name
    assert habit_in_list["start_date"] == "04-04-25" # Check serialized date format
    assert habit_in_list["last_completed"] == "04-04-25" # Check serialized date format
    assert habit_in_list["occurence"] == test_habit_data.occurence.value
    assert habit_in_list["x_occurence"] == test_habit_data.x_occurence


    mock_redis["get_all"].assert_called_once_with(mock_redis["connection"], expected_pattern, models.Habit)


def test_read_user_habits_empty(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test listing habits when the user has none."""
    expected_pattern = user_habits_pattern(test_user_username)
    mock_redis["get_all"].return_value = [] # Simulate empty list

    response = authenticated_client.get("/habits/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0
    mock_redis["get_all"].assert_called_once_with(mock_redis["connection"], expected_pattern, models.Habit)


def test_read_habit_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test getting a specific habit by ID."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)
    # Simulate redis returning the specific habit
    mock_redis["get"].return_value = test_habit_data

    response = authenticated_client.get(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == habit_id
    assert data["userId"] == test_user_username
    assert data["name"] == test_habit_data.name
    assert data["start_date"] == "04-04-25" # Check serialized date format
    assert data["last_completed"] == "04-04-25" # Check serialized date format
    assert data["occurence"] == test_habit_data.occurence.value
    assert data["x_occurence"] == test_habit_data.x_occurence

    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)


def test_read_habit_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test getting a habit that does not exist."""
    habit_id = "nonexistent_habit"
    expected_key = habit_key(test_user_username, habit_id)
    mock_redis["get"].return_value = None # Simulate not found

    response = authenticated_client.get(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Habit not found" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)


def test_read_habit_unauthorized(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test getting a habit belonging to another user (should ideally be caught by key)."""
    # This scenario tests the explicit check within the endpoint, although the key structure
    # should prevent fetching another user's data if redis_get respects the key.
    habit_id = "other_user_habit"
    expected_key = habit_key(test_user_username, habit_id) # Key for the *current* user
    # Simulate redis returning a habit, but with a different userId
    # Correctly use model_copy with update dictionary
    habit_from_other_user = test_habit_data.model_copy(update={"id": habit_id, "userId": "anotheruser"})
    mock_redis["get"].return_value = habit_from_other_user

    response = authenticated_client.get(f"/habits/{habit_id}")

    # Depending on whether redis_get strictly uses the key or if the check happens after:
    # If redis_get finds nothing with the user-specific key: 404
    # If redis_get somehow returns the wrong item AND the check catches it: 403
    # Given the code's check `if habit.userId != current_username:`, we expect 403 if redis_get returns it.
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)


# --- Test Habit Update ---

def test_update_habit_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test successfully updating a habit."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)
    update_payload = {"name": "Updated Test Habit", "aura": 15}

    # Mock redis_update to return the updated habit data
    updated_habit = test_habit_data.model_copy(update=update_payload)
    mock_redis["update"].return_value = updated_habit

    response = authenticated_client.put(f"/habits/{habit_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == habit_id
    assert data["userId"] == test_user_username
    assert data["name"] == update_payload["name"]
    assert data["aura"] == update_payload["aura"]
    # Dates should remain the same unless updated, check serialized format
    assert data["start_date"] == "04-04-25"
    assert data["last_completed"] == "04-04-25"

    # The update payload passed to redis_update should be the dictionary
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Habit
    )


def test_update_habit_partial_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test partially updating a habit."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)
    update_payload = {"aura": 25} # Only update aura

    # Mock redis_update to return the updated habit data
    updated_habit = test_habit_data.model_copy(update=update_payload)
    mock_redis["update"].return_value = updated_habit

    response = authenticated_client.put(f"/habits/{habit_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == habit_id
    assert data["name"] == test_habit_data.name # Name should be unchanged
    assert data["aura"] == update_payload["aura"] # Aura should be updated
    # Dates should remain the same unless updated, check serialized format
    assert data["start_date"] == "04-04-25"
    assert data["last_completed"] == "04-04-25"

    # The update payload passed to redis_update should be the dictionary
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Habit
    )


def test_update_habit_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test updating a habit that does not exist."""
    habit_id = "nonexistent_habit"
    expected_key = habit_key(test_user_username, habit_id)
    update_payload = {"name": "Updated Name"}

    # Simulate redis_update finding nothing to update
    mock_redis["update"].return_value = None

    response = authenticated_client.put(f"/habits/{habit_id}", json=update_payload)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Habit not found" in response.json()["detail"]
    # The update payload passed to redis_update should be the dictionary
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Habit
    )


# --- Test Habit Deletion ---

def test_delete_habit_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test successfully deleting a habit."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)

    # Mock redis_get for the pre-delete check
    mock_redis["get"].return_value = test_habit_data
    # Mock redis_delete to simulate successful deletion
    mock_redis["delete"].return_value = 1

    response = authenticated_client.delete(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], expected_key)


def test_delete_habit_not_found_pre_check(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test deleting a habit that is not found during the pre-delete check."""
    habit_id = "nonexistent_habit"
    expected_key = habit_key(test_user_username, habit_id)

    # Mock redis_get for the pre-delete check to return None
    mock_redis["get"].return_value = None

    response = authenticated_client.delete(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Habit not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)
    mock_redis["delete"].assert_not_called() # Delete should not be called


def test_delete_habit_not_found_during_delete(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test deleting a habit where the pre-check passes but delete returns 0 (race condition)."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)

    # Mock redis_get for the pre-delete check
    mock_redis["get"].return_value = test_habit_data
    # Mock redis_delete to simulate deletion failing (e.g., key disappeared)
    mock_redis["delete"].return_value = 0

    response = authenticated_client.delete(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    # The specific error message depends on the implementation detail in the router
    assert "Habit not found" in response.json()["detail"] # Matches the second 404 check
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], expected_key)


def test_delete_habit_unauthorized(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test deleting a habit where the pre-check finds a habit owned by another user."""
    habit_id = "other_user_habit"
    expected_key = habit_key(test_user_username, habit_id) # Key for the *current* user

    # Simulate redis_get returning a habit owned by someone else
    # Correctly use model_copy with update dictionary
    habit_from_other_user = test_habit_data.model_copy(update={"id": habit_id, "userId": "anotheruser"})
    mock_redis["get"].return_value = habit_from_other_user

    response = authenticated_client.delete(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND # Router raises 404 in this specific check
    assert "Habit not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)
    mock_redis["delete"].assert_not_called()
