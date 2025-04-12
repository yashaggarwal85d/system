import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend import models, auth


test_username = "testuser"
test_password = "testpassword"
signup_data = {
    "username": test_username,
    "password": test_password,
    "level": 1,
    "aura": 100,
    "description": "Test Player Signup"
}



def test_signup_player_success(client: TestClient, mock_redis):
    """Test successful player signup."""
    
    mock_redis["get"].return_value = None
    
    with patch("backend.auth.get_password_hash", return_value="hashed_password"):
        response = client.post("/players/signup", json=signup_data)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == test_username
    assert data["password"] == "hidden" 
    assert data["level"] == signup_data["level"]
    
    mock_redis["set"].assert_called_once()
    
    saved_data = mock_redis["set"].call_args[0][2] 
    assert saved_data.username == test_username
    assert saved_data.password == "hashed_password"


def test_signup_player_username_taken(client: TestClient, mock_redis, test_player_data):
    """Test signup when username is already registered."""
    
    mock_redis["get"].return_value = test_player_data 

    response = client.post("/players/signup", json=signup_data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Username already registered" in response.json()["detail"]
    mock_redis["set"].assert_not_called() 



def test_login_success(client: TestClient, mock_redis, test_player_data):
    """Test successful player login."""
    
    hashed_password = auth.get_password_hash(test_password) 
    player_in_db = test_player_data.model_copy(update={"password": hashed_password})
    mock_redis["get"].return_value = player_in_db

    
    with patch("backend.auth.verify_password", return_value=True) as mock_verify, \
         patch("backend.auth.create_access_token", return_value="test_token") as mock_create_token:
        login_form_data = {"username": test_username, "password": test_password}
        response = client.post("/players/login", data=login_form_data) 

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["access_token"] == "test_token"
    assert data["token_type"] == "bearer"
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], f"player:{test_username}", models.Player)
    mock_verify.assert_called_once_with(test_password, hashed_password) 
    mock_create_token.assert_called_once() 


def test_login_user_not_found(client: TestClient, mock_redis):
    """Test login when username does not exist."""
    mock_redis["get"].return_value = None 

    login_form_data = {"username": "nonexistentuser", "password": "wrongpassword"}
    response = client.post("/players/login", data=login_form_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect username or password" in response.json()["detail"]


def test_login_incorrect_password(client: TestClient, mock_redis, test_player_data):
    """Test login with incorrect password."""
    
    hashed_password = auth.get_password_hash("correct_password")
    player_in_db = test_player_data.model_copy(update={"password": hashed_password})
    mock_redis["get"].return_value = player_in_db

    
    with patch("backend.auth.verify_password", return_value=False) as mock_verify:
        login_form_data = {"username": test_username, "password": "wrongpassword"}
        response = client.post("/players/login", data=login_form_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect username or password" in response.json()["detail"]
    mock_verify.assert_called_once_with("wrongpassword", hashed_password) 




def test_read_players_me_success(authenticated_client: TestClient, mock_redis, test_player_data, test_user_username):
    """Test getting the current user's profile successfully."""
    
    player_in_db = test_player_data.model_copy(update={"password": "hashed_password"})
    mock_redis["get"].return_value = player_in_db

    response = authenticated_client.get("/players/me")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == test_user_username
    assert data["level"] == test_player_data.level
    assert data["password"] == "hidden" 
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], f"player:{test_user_username}", models.Player)

def test_read_players_me_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test getting profile when user somehow doesn't exist in DB despite valid token."""
    mock_redis["get"].return_value = None 

    response = authenticated_client.get("/players/me")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Player not found" in response.json()["detail"]


def test_update_player_me_success(authenticated_client: TestClient, mock_redis, test_player_data, test_user_username):
    """Test updating the current user's profile successfully."""
    
    update_payload = {
        "level": 5,
        "aura": 500,
        "description": "Updated Description",
    }
    
    existing_player = test_player_data.model_copy(update={"password": "hashed_password"})
    mock_redis["get"].return_value = existing_player

    
    
    updated_player_data_in_db = existing_player.model_copy(
        update={k: v for k, v in update_payload.items() if k != 'password'}
    )
    mock_redis["update"].return_value = updated_player_data_in_db

    response = authenticated_client.put("/players/me", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == test_user_username
    assert data["level"] == update_payload["level"]
    assert data["aura"] == update_payload["aura"]
    assert data["description"] == update_payload["description"]
    assert data["password"] == "hidden" 

    mock_redis["get"].assert_called_once_with(mock_redis["connection"], f"player:{test_user_username}", models.Player)
    
    mock_redis["update"].assert_called_once_with(
        mock_redis["connection"], f"player:{test_user_username}", update_payload, models.Player
    )
    
    
    
    
    





def test_update_player_me_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test updating profile when user not found in DB."""
    
    update_payload = {
        "level": 1, 
        "aura": 10, 
        "description": "Full Payload Update",
    }
    mock_redis["get"].return_value = None 

    
    response = authenticated_client.put("/players/me", json=update_payload)

    

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Player not found" in response.json()["detail"]


def test_delete_player_me_success(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test deleting the current user's account successfully."""
    mock_redis["delete"].return_value = 1 

    response = authenticated_client.delete("/players/me")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    mock_redis["delete"].assert_called_once_with(mock_redis["connection"], f"player:{test_user_username}")


def test_delete_player_me_not_found(authenticated_client: TestClient, mock_redis, test_user_username):
    """Test deleting when user not found in DB."""
    mock_redis["delete"].return_value = 0 

    response = authenticated_client.delete("/players/me")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Player not found" in response.json()["detail"]





def test_read_player_success(authenticated_client: TestClient, mock_redis, test_player_data, test_user_username):
    """Test getting a specific player by username (assuming authenticated user has access)."""
    target_username = "anotheruser"
    
    player_in_db = test_player_data.model_copy(update={"username": target_username, "password": "hashed_password"})
    mock_redis["get"].return_value = player_in_db

    
    
    response = authenticated_client.get(f"/players/{target_username}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == target_username
    assert data["password"] == "hidden" 
    mock_redis["get"].assert_called_once_with(mock_redis["connection"], f"player:{target_username}", models.Player)

def test_read_player_not_found(authenticated_client: TestClient, mock_redis):
    """Test getting a specific player that does not exist."""
    target_username = "nonexistentuser"
    mock_redis["get"].return_value = None 

    response = authenticated_client.get(f"/players/{target_username}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Player not found" in response.json()["detail"]
