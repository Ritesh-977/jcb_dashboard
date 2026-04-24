import json
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from typing import Optional
from app.db import get_snowflake_connection
from app.middleware import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "viewer"
    permissions: list[str] = []


class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    permissions: Optional[list[str]] = None
    is_active: Optional[bool] = None


@router.get("/users")
def list_users(page: int = 1, page_size: int = 20, _: dict = Depends(require_admin)):
    offset = (page - 1) * page_size
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT ID, EMAIL, ROLE, PERMISSIONS, IS_ACTIVE FROM USERS ORDER BY ID DESC LIMIT %s OFFSET %s",
            (page_size, offset),
        )
        rows = cur.fetchall()
        cur.execute("SELECT COUNT(*) FROM USERS")
        total = cur.fetchone()[0]
    users = [
        {"id": r[0], "email": r[1], "role": r[2], "permissions": json.loads(r[3] or "[]"), "is_active": r[4]}
        for r in rows
    ]
    return {"users": users, "total": total, "page": page, "page_size": page_size}


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(body: CreateUserRequest, _: dict = Depends(require_admin)):
    if body.role not in ("admin", "viewer"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'viewer'")
    hashed = pwd_context.hash(body.password)
    perms_json = json.dumps(body.permissions)
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT ID FROM USERS WHERE EMAIL = %s", (body.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="A user with this email already exists")
        try:
            cur.execute(
                "INSERT INTO USERS (EMAIL, PASSWORD_HASH, ROLE, PERMISSIONS, IS_ACTIVE) VALUES (%s, %s, %s, %s, TRUE)",
                (body.email, hashed, body.role, perms_json),
            )
            conn.commit()
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                raise HTTPException(status_code=409, detail="A user with this email already exists")
            raise HTTPException(status_code=500, detail=str(e))
    return {"message": "User created"}


@router.put("/users/{user_id}")
def update_user(user_id: int, body: UpdateUserRequest, current_admin: dict = Depends(require_admin)):
    if str(user_id) == current_admin["sub"]:
        if body.role == "viewer":
            raise HTTPException(status_code=400, detail="Cannot remove your own admin role")
        if body.is_active is False:
            raise HTTPException(status_code=400, detail="Cannot disable your own account")

    fields, values = [], []
    if body.role is not None:
        if body.role not in ("admin", "viewer"):
            raise HTTPException(status_code=400, detail="Role must be 'admin' or 'viewer'")
        fields.append("ROLE = %s")
        values.append(body.role)
    if body.permissions is not None:
        fields.append("PERMISSIONS = %s")
        values.append(json.dumps(body.permissions))
    if body.is_active is not None:
        fields.append("IS_ACTIVE = %s")
        values.append(body.is_active)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    values.append(user_id)
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute(f"UPDATE USERS SET {', '.join(fields)} WHERE ID = %s", values)
        conn.commit()
    return {"message": "User updated"}
