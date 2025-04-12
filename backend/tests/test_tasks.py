import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from fastapi import status
from fastapi.testclient import TestClient

from backend import models
from backend.routers.tasks import task_key, user_tasks_pattern



def test_create_task_success(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test successful task creation."""
    task_payload = test_task_data.model_dump()
    expected_key = task_key(test_user_username, test_task_data.id)

    response = authenticated_client.post("/tasks/", json=task_payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] == test_task_data.id
    assert data["userId"] == test_user_username
    assert data["name"] == test_task_data.name
    assert data["due_date"] == "10-04-25" 
    assert data["aura"] == test_task_data.aura 
    assert data["completed"] is False 

    
    mock_redis["set"].assert_called_once_with(mock_redis["connection"], expected_key, test_task_data)


def test_create_task_for_another_user(authenticated_client: TestClient, test_task_data, test_user_username):
    """Test attempting to create a task for a different userId."""
    task_payload = test_task_data.model_copy(update={"userId": "anotheruser"}).model_dump()

    response = authenticated_client.post("/tasks/", json=task_payload)

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Cannot create task for another user" in response.json()["detail"]




def test_read_user_tasks_success(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test listing all tasks for the current user."""
    expected_pattern = user_tasks_pattern(test_user_username)
    
    mock_redis["get_all"].return_value = [test_task_data]

    response = authenticated_client.get("/tasks/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    task_in_list = data[0]
    assert task_in_list["id"] == test_task_data.id
    assert task_in_list["userId"] == test_user_username
    assert task_in_list["name"] == test_task_data.name
    assert task_in_list["due_date"] == "10-04-25" 
    assert task_in_list["aura"] == test_task_data.aura 
    assert task_in_list["completed"] is False 

    mock_redis["get_all"].assert_called_once_with(mock_redis["connection"], expected_pattern, models.Task)


def test_read_user_tasks_empty(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test listing tasks when the user has none."""
    expected_pattern = user_tasks_pattern(test_user_username)
    mock_redis["get_all"].return_value = [] 

    response = authenticated_client.get("/tasks/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0
    mock_redis["get_all"].assert_called_once_with(mock_redis["connection"], expected_pattern, models.Task)


def test_read_task_success(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test getting a specific task by ID."""
    task_id = test_task_data.id
    expected_key = task_key(test_user_username, task_id)
    
    mock_redis["get"].return_value = test_task_data

    response = authenticated_client.get(f"/tasks/{task_id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == task_id
    assert data["userId"] == test_user_username
    assert data["name"] == test_task_data.name
    assert data["due_date"] == "10-04-25" 
    assert data["aura"] == test_task_data.aura 
    assert data["completed"] is False 

    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Task)


def test_read_task_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test getting a task that does not exist."""
    task_id = "nonexistent_task"
    expected_key = task_key(test_user_username, task_id)
    mock_redis["get"].return_value = None 

    response = authenticated_client.get(f"/tasks/{task_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Task not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Task)


def test_read_task_unauthorized(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test getting a task belonging to another user."""
    task_id = "other_user_task"
    expected_key = task_key(test_user_username, task_id)
    
    task_from_other_user = test_task_data.model_copy(update={"id": task_id, "userId": "anotheruser"})
    mock_redis["get"].return_value = task_from_other_user

    response = authenticated_client.get(f"/tasks/{task_id}")

    
    assert response.status_code == status.HTTP_404_NOT_FOUND 
    assert "Task not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Task)




def test_update_task_success(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test successfully updating a task."""
    task_id = test_task_data.id
    expected_key = task_key(test_user_username, task_id)
    
    update_payload = {"name": "Updated Test Task", "aura": 15}

    
    
    updated_task = test_task_data.model_copy(update=update_payload)
    mock_redis["update"].return_value = updated_task

    response = authenticated_client.put(f"/tasks/{task_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == task_id
    assert data["userId"] == test_user_username
    assert data["name"] == update_payload["name"]
    assert data["aura"] == update_payload["aura"] 
    assert data["due_date"] == "10-04-25" 
    assert data["completed"] is False 

    
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Task
    )


def test_update_task_partial_success(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test partially updating a task."""
    task_id = test_task_data.id
    expected_key = task_key(test_user_username, task_id)
    
    update_payload = {"due_date": "2025-05-01"}

    
    
    
    from datetime import date
    updated_task = test_task_data.model_copy(update={"due_date": date(2025, 5, 1)}) 
    mock_redis["update"].return_value = updated_task

    response = authenticated_client.put(f"/tasks/{task_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == task_id
    assert data["name"] == test_task_data.name 
    assert data["due_date"] == "01-05-25" 
    assert data["aura"] == test_task_data.aura 
    assert data["completed"] is False 

    
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Task
    )


def test_update_task_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test updating a task that does not exist."""
    task_id = "nonexistent_task"
    expected_key = task_key(test_user_username, task_id)
    update_payload = {"name": "Updated Name"}

    
    mock_redis["update"].return_value = None

    response = authenticated_client.put(f"/tasks/{task_id}", json=update_payload)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Task not found or update failed" in response.json()["detail"]
    
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], expected_key, update_payload, models.Task
    )




def test_delete_task_success(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test successfully deleting a task."""
    task_id = test_task_data.id
    expected_key = task_key(test_user_username, task_id)

    
    mock_redis["get"].return_value = test_task_data
    
    mock_redis["delete"].return_value = 1

    response = authenticated_client.delete(f"/tasks/{task_id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Task)
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], expected_key)


def test_delete_task_not_found_pre_check(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test deleting a task that is not found during the pre-delete check."""
    task_id = "nonexistent_task"
    expected_key = task_key(test_user_username, task_id)

    
    mock_redis["get"].return_value = None

    response = authenticated_client.delete(f"/tasks/{task_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Task not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Task)
    mock_redis["delete"].assert_not_called() 


def test_delete_task_not_found_during_delete(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test deleting a task where the pre-check passes but delete returns 0."""
    task_id = test_task_data.id
    expected_key = task_key(test_user_username, task_id)

    
    mock_redis["get"].return_value = test_task_data
    
    mock_redis["delete"].return_value = 0

    response = authenticated_client.delete(f"/tasks/{task_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Task not found" in response.json()["detail"] 
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Task)
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], expected_key)


def test_delete_task_unauthorized(authenticated_client: TestClient, mock_redis, test_task_data, test_user_username):
    """Test deleting a task where the pre-check finds a task owned by another user."""
    task_id = "other_user_task"
    expected_key = task_key(test_user_username, task_id)

    
    
    task_from_other_user = test_task_data.model_copy(update={"id": task_id, "userId": "anotheruser"})
    mock_redis["get"].return_value = task_from_other_user

    response = authenticated_client.delete(f"/tasks/{task_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND 
    assert "Task not found or not authorized" in response.json()["detail"]
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], expected_key, models.Task)
    mock_redis["delete"].assert_not_called()
