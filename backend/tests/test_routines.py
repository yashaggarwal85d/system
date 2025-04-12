import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from fastapi import status
from fastapi.testclient import TestClient

from backend import models
from backend.routers.routines import routine_key, user_routines_pattern

# --- Test Routine Creation ---

def test_create_routine_success(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test successful routine creation."""
    routine_payload = test_routine_data.model_dump()
    expected_key = routine_key(test_user_username, test_routine_data.id)

    response = authenticated_client.post("/routines/", json=routine_payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] == test_routine_data.id
    assert data["userId"] == test_user_username
    assert data["name"] == test_routine_data.name
    assert data["checklist"] == test_routine_data.checklist
    assert data["start_date"] == "04-04-25" # Check serialized date format
    assert data["last_completed"] == "04-04-25" # Check serialized date format
    assert data["occurence"] == test_routine_data.occurence.value
    assert data["x_occurence"] == test_routine_data.x_occurence

    # Check if redis_set was called correctly
    mock_redis["set"].assert_called_once_with(mock_redis["connection"], expected_key, test_routine_data)


def test_create_routine_for_another_user(authenticated_client: TestClient, test_routine_data, test_user_username):
    """Test attempting to create a routine for a different userId."""
    routine_payload = test_routine_data.model_copy(update={"userId": "anotheruser"}).model_dump()

    response = authenticated_client.post("/routines/", json=routine_payload)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Cannot create routine for another user" in response.json()["detail"]


# --- Test Reading Routines ---

def test_read_user_routines_success(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test listing all routines for the current user."""
    expected_pattern = user_routines_pattern(test_user_username)
    # Simulate redis returning a list of routines
    mock_redis["get_all"].return_value = [test_routine_data]

    response = authenticated_client.get("/routines/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    routine_in_list = data[0]
    assert routine_in_list["id"] == test_routine_data.id
    assert routine_in_list["userId"] == test_user_username
    assert routine_in_list["name"] == test_routine_data.name
    assert routine_in_list["checklist"] == test_routine_data.checklist
    assert routine_in_list["start_date"] == "04-04-25" # Check serialized date format
    assert routine_in_list["last_completed"] == "04-04-25" # Check serialized date format
    assert routine_in_list["occurence"] == test_routine_data.occurence.value
    assert routine_in_list["x_occurence"] == test_routine_data.x_occurence

    mock_redis["get_all"].assert_called_once_with(mock_redis["connection"], expected_pattern, models.Routine)


def test_read_user_routines_empty(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test listing routines when the user has none."""
    expected_pattern = user_routines_pattern(test_user_username)
    mock_redis["get_all"].return_value = [] # Simulate empty list

    response = authenticated_client.get("/routines/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0
    mock_redis["get_all"].assert_called_once_with(mock_redis["connection"], expected_pattern, models.Routine)


def test_read_routine_success(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test getting a specific routine by ID."""
    routine_id = test_routine_data.id
    expected_key = routine_key(test_user_username, routine_id)
    # Simulate redis returning the specific routine
    mock_redis["get"].return_value = test_routine_data

    response = authenticated_client.get(f"/routines/{routine_id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == routine_id
    assert data["userId"] == test_user_username
    assert data["name"] == test_routine_data.name
    assert data["checklist"] == test_routine_data.checklist
    assert data["start_date"] == "04-04-25" # Check serialized date format
    assert data["last_completed"] == "04-04-25" # Check serialized date format
    assert data["occurence"] == test_routine_data.occurence.value
    assert data["x_occurence"] == test_routine_data.x_occurence

    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Routine)


def test_read_routine_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test getting a routine that does not exist."""
    routine_id = "nonexistent_routine"
    expected_key = routine_key(test_user_username, routine_id)
    mock_redis["get"].return_value = None # Simulate not found

    response = authenticated_client.get(f"/routines/{routine_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Routine not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Routine)


def test_read_routine_unauthorized(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test getting a routine belonging to another user."""
    routine_id = "other_user_routine"
    expected_key = routine_key(test_user_username, routine_id)
    # Correctly use model_copy with update dictionary
    routine_from_other_user = test_routine_data.model_copy(update={"id": routine_id, "userId": "anotheruser"})
    mock_redis["get"].return_value = routine_from_other_user

    response = authenticated_client.get(f"/routines/{routine_id}")

    # Check `if routine is None or routine.userId != current_username:`
    assert response.status_code == status.HTTP_404_NOT_FOUND # Router raises 404
    assert "Routine not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Routine)


# --- Test Routine Update ---

def test_update_routine_success(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test successfully updating a routine."""
    routine_id = test_routine_data.id
    expected_key = routine_key(test_user_username, routine_id)
    update_payload = {"name": "Updated Test Routine", "aura": 25, "checklist": "[x] Item 1\n[ ] Item 3"}

    # Mock redis_update to return the updated routine data
    updated_routine = test_routine_data.model_copy(update=update_payload)
    mock_redis["update"].return_value = updated_routine

    response = authenticated_client.put(f"/routines/{routine_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == routine_id
    assert data["userId"] == test_user_username
    assert data["name"] == update_payload["name"]
    assert data["aura"] == update_payload["aura"]
    assert data["checklist"] == update_payload["checklist"]
    # Dates should remain the same unless updated, check serialized format
    assert data["start_date"] == "04-04-25"
    assert data["last_completed"] == "04-04-25"

    # Assert mock call
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Routine
    )


def test_update_routine_partial_success(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test partially updating a routine."""
    routine_id = test_routine_data.id
    expected_key = routine_key(test_user_username, routine_id)
    update_payload = {"x_occurence": 3} # Update x_occurence instead of removed 'repeat'

    # Mock redis_update to return the updated routine data
    updated_routine = test_routine_data.model_copy(update=update_payload)
    mock_redis["update"].return_value = updated_routine

    response = authenticated_client.put(f"/routines/{routine_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == routine_id
    assert data["name"] == test_routine_data.name # Name should be unchanged
    assert data["x_occurence"] == update_payload["x_occurence"] # x_occurence should be updated
    assert data["aura"] == test_routine_data.aura # Aura unchanged
    assert data["start_date"] == "04-04-25" # Date unchanged
    assert data["last_completed"] == "04-04-25" # Date unchanged

    # Assert mock call
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Routine
    )


def test_update_routine_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test updating a routine that does not exist."""
    routine_id = "nonexistent_routine"
    expected_key = routine_key(test_user_username, routine_id)
    update_payload = {"name": "Updated Name"}

    # Simulate redis_update finding nothing to update
    mock_redis["update"].return_value = None

    response = authenticated_client.put(f"/routines/{routine_id}", json=update_payload)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Routine not found or update failed" in response.json()["detail"]
    # Assert mock call
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Routine
    )


# --- Test Routine Deletion ---

def test_delete_routine_success(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test successfully deleting a routine."""
    routine_id = test_routine_data.id
    expected_key = routine_key(test_user_username, routine_id)

    # Mock redis_get for the pre-delete check
    mock_redis["get"].return_value = test_routine_data
    # Mock redis_delete to simulate successful deletion
    mock_redis["delete"].return_value = 1

    response = authenticated_client.delete(f"/routines/{routine_id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Routine)
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], expected_key)


def test_delete_routine_not_found_pre_check(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test deleting a routine that is not found during the pre-delete check."""
    routine_id = "nonexistent_routine"
    expected_key = routine_key(test_user_username, routine_id)

    # Mock redis_get for the pre-delete check to return None
    mock_redis["get"].return_value = None

    response = authenticated_client.delete(f"/routines/{routine_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Routine not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Routine)
    mock_redis["delete"].assert_not_called() # Delete should not be called


def test_delete_routine_not_found_during_delete(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test deleting a routine where the pre-check passes but delete returns 0."""
    routine_id = test_routine_data.id
    expected_key = routine_key(test_user_username, routine_id)

    # Mock redis_get for the pre-delete check
    mock_redis["get"].return_value = test_routine_data
    # Mock redis_delete to simulate deletion failing
    mock_redis["delete"].return_value = 0

    response = authenticated_client.delete(f"/routines/{routine_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Routine not found" in response.json()["detail"] # Matches the second 404 check
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Routine)
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], expected_key)


def test_delete_routine_unauthorized(authenticated_client: TestClient, mock_redis, test_routine_data, test_user_username):
    """Test deleting a routine where the pre-check finds a routine owned by another user."""
    routine_id = "other_user_routine"
    expected_key = routine_key(test_user_username, routine_id)

    # Simulate redis_get returning a routine owned by someone else
    # Correctly use model_copy with update dictionary
    routine_from_other_user = test_routine_data.model_copy(update={"id": routine_id, "userId": "anotheruser"})
    mock_redis["get"].return_value = routine_from_other_user

    response = authenticated_client.delete(f"/routines/{routine_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND # Router raises 404 in this specific check
    assert "Routine not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Routine)
    mock_redis["delete"].assert_not_called()
