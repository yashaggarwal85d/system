from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

# --- JWT Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if not SECRET_KEY:
    raise EnvironmentError("SECRET_KEY environment variable not set.")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="players/login") # Points to the login endpoint

class TokenData(BaseModel):
    username: str | None = None

# --- JWT Creation ---
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- JWT Verification / Get Current User ---
async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """Decodes the JWT token and returns the user data (username)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    return token_data

# --- Optional: Get Current Active User (Example - if you need to fetch user from DB) ---
# from .database import get_redis_connection, redis_get
# from .models import Player
#
# async def get_current_active_user(current_user: TokenData = Depends(get_current_user)) -> Player:
#     """Fetches the full user object from DB based on token data."""
#     r = await get_redis_connection()
#     user = await redis_get(r, f"player:{current_user.username}", Player)
#     if user is None:
#         raise HTTPException(status_code=404, detail="User not found")
#     # Add checks here if users can be deactivated, etc.
#     # if user.disabled:
#     #     raise HTTPException(status_code=400, detail="Inactive user")
#     return user
