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


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT ID, EMAIL, ROLE, PASSWORD_HASH FROM USERS WHERE EMAIL = %s", (body.email,))
        row = cur.fetchone()
    finally:
        conn.close()

    if not row or not pwd_context.verify(body.password, row[3]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(row[0]), "email": row[1], "role": row[2]})
    return {"access_token": token}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
