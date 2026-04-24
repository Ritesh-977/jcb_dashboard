import json
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from app.db import get_snowflake_connection
from app.auth import create_access_token
from app.middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


def _fetch_user(email: str):
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT ID, EMAIL, ROLE, PASSWORD_HASH, PERMISSIONS, IS_ACTIVE FROM USERS WHERE EMAIL = %s",
            (email,),
        )
        row = cur.fetchone()  # must be inside the with block
    return row


def _build_token(row) -> dict:
    perms = row[4] or "[]"
    if isinstance(perms, str):
        perms = json.loads(perms)
    token = create_access_token({"sub": str(row[0]), "email": row[1], "role": row[2], "permissions": perms})
    return {"access_token": token}


@router.post("/dashboard-login", response_model=TokenResponse)
def dashboard_login(body: LoginRequest):
    row = _fetch_user(body.email)
    if not row or not pwd_context.verify(body.password, row[3]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not row[5]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return _build_token(row)


@router.post("/admin-login", response_model=TokenResponse)
def admin_login(body: LoginRequest):
    row = _fetch_user(body.email)
    if not row or not pwd_context.verify(body.password, row[3]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not row[5]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    if row[2] != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return _build_token(row)


@router.put("/change-password")
def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT PASSWORD_HASH FROM USERS WHERE ID = %s", (current_user["sub"],))
        row = cur.fetchone()
    if not row or not pwd_context.verify(body.old_password, row[0]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Old password is incorrect")
    new_hash = pwd_context.hash(body.new_password)
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE USERS SET PASSWORD_HASH = %s WHERE ID = %s", (new_hash, current_user["sub"]))
        conn.commit()
    return {"message": "Password updated"}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
