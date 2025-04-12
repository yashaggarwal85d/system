import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from fastapi import status
from fastapi.testclient import TestClient
from backend import models
from backend.routers.habits import habit_key, user_habits_pattern



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
    assert data["start_date"] == "04-04-25" 
    assert data["last_completed"] == "04-04-25" 
    assert data["occurence"] == test_habit_data.occurence.value
    assert data["x_occurence"] == test_habit_data.x_occurence

    
    
    mock_redis["set"].assert_called_once_with(mock_redis["connection"], expected_key, test_habit_data)


def test_create_habit_for_another_user(authenticated_client: TestClient, test_habit_data, test_user_username):
    """Test attempting to create a habit for a different userId."""
    habit_payload = test_habit_data.model_copy(update={"userId": "anotheruser"}).model_dump()

    response = authenticated_client.post("/habits/", json=habit_payload)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Cannot create habit for another user" in response.json()["detail"]




def test_read_user_habits_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test listing all habits for the current user."""
    expected_pattern = user_habits_pattern(test_user_username)
    
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
    assert habit_in_list["start_date"] == "04-04-25" 
    assert habit_in_list["last_completed"] == "04-04-25" 
    assert habit_in_list["occurence"] == test_habit_data.occurence.value
    assert habit_in_list["x_occurence"] == test_habit_data.x_occurence


    mock_redis["get_all"].assert_called_once_with(mock_redis["connection"], expected_pattern, models.Habit)


def test_read_user_habits_empty(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test listing habits when the user has none."""
    expected_pattern = user_habits_pattern(test_user_username)
    mock_redis["get_all"].return_value = [] 

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
    
    mock_redis["get"].return_value = test_habit_data

    response = authenticated_client.get(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == habit_id
    assert data["userId"] == test_user_username
    assert data["name"] == test_habit_data.name
    assert data["start_date"] == "04-04-25" 
    assert data["last_completed"] == "04-04-25" 
    assert data["occurence"] == test_habit_data.occurence.value
    assert data["x_occurence"] == test_habit_data.x_occurence

    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)


def test_read_habit_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test getting a habit that does not exist."""
    habit_id = "nonexistent_habit"
    expected_key = habit_key(test_user_username, habit_id)
    mock_redis["get"].return_value = None 

    response = authenticated_client.get(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Habit not found" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)


def test_read_habit_unauthorized(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test getting a habit belonging to another user (should ideally be caught by key)."""
    
    
    habit_id = "other_user_habit"
    expected_key = habit_key(test_user_username, habit_id) 
    
    
    habit_from_other_user = test_habit_data.model_copy(update={"id": habit_id, "userId": "anotheruser"})
    mock_redis["get"].return_value = habit_from_other_user

    response = authenticated_client.get(f"/habits/{habit_id}")

    
    
    
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)




def test_update_habit_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test successfully updating a habit."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)
    update_payload = {"name": "Updated Test Habit", "aura": 15}

    
    updated_habit = test_habit_data.model_copy(update=update_payload)
    mock_redis["update"].return_value = updated_habit

    response = authenticated_client.put(f"/habits/{habit_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == habit_id
    assert data["userId"] == test_user_username
    assert data["name"] == update_payload["name"]
    assert data["aura"] == update_payload["aura"]
    
    assert data["start_date"] == "04-04-25"
    assert data["last_completed"] == "04-04-25"

    
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Habit
    )


def test_update_habit_partial_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test partially updating a habit."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)
    update_payload = {"aura": 25} 

    
    updated_habit = test_habit_data.model_copy(update=update_payload)
    mock_redis["update"].return_value = updated_habit

    response = authenticated_client.put(f"/habits/{habit_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == habit_id
    assert data["name"] == test_habit_data.name 
    assert data["aura"] == update_payload["aura"] 
    
    assert data["start_date"] == "04-04-25"
    assert data["last_completed"] == "04-04-25"

    
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Habit
    )


def test_update_habit_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test updating a habit that does not exist."""
    habit_id = "nonexistent_habit"
    expected_key = habit_key(test_user_username, habit_id)
    update_payload = {"name": "Updated Name"}

    
    mock_redis["update"].return_value = None

    response = authenticated_client.put(f"/habits/{habit_id}", json=update_payload)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Habit not found" in response.json()["detail"]
    
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Habit
    )




def test_delete_habit_success(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test successfully deleting a habit."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)

    
    mock_redis["get"].return_value = test_habit_data
    
    mock_redis["delete"].return_value = 1

    response = authenticated_client.delete(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], expected_key)


def test_delete_habit_not_found_pre_check(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test deleting a habit that is not found during the pre-delete check."""
    habit_id = "nonexistent_habit"
    expected_key = habit_key(test_user_username, habit_id)

    
    mock_redis["get"].return_value = None

    response = authenticated_client.delete(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Habit not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)
    mock_redis["delete"].assert_not_called() 


def test_delete_habit_not_found_during_delete(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test deleting a habit where the pre-check passes but delete returns 0 (race condition)."""
    habit_id = test_habit_data.id
    expected_key = habit_key(test_user_username, habit_id)

    
    mock_redis["get"].return_value = test_habit_data
    
    mock_redis["delete"].return_value = 0

    response = authenticated_client.delete(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    
    assert "Habit not found" in response.json()["detail"] 
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], expected_key)


def test_delete_habit_unauthorized(authenticated_client: TestClient, mock_redis, test_habit_data, test_user_username):
    """Test deleting a habit where the pre-check finds a habit owned by another user."""
    habit_id = "other_user_habit"
    expected_key = habit_key(test_user_username, habit_id) 

    
    
    habit_from_other_user = test_habit_data.model_copy(update={"id": habit_id, "userId": "anotheruser"})
    mock_redis["get"].return_value = habit_from_other_user

    response = authenticated_client.delete(f"/habits/{habit_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND 
    assert "Habit not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Habit)
    mock_redis["delete"].assert_not_called()
