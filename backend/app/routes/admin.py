import json
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from typing import Optional
from app.db import get_snowflake_connection
from app.middleware import require_admin
from app.routes import dashboard as dashboard_module

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


class ResetPasswordRequest(BaseModel):
    new_password: str


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


@router.put("/users/{user_id}/reset-password")
def reset_user_password(user_id: int, body: ResetPasswordRequest, current_admin: dict = Depends(require_admin)):
    if str(user_id) == current_admin["sub"]:
        raise HTTPException(status_code=400, detail="Use /auth/change-password to update your own password")
    hashed = pwd_context.hash(body.new_password)
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT ID FROM USERS WHERE ID = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        cur.execute("UPDATE USERS SET PASSWORD_HASH = %s WHERE ID = %s", (hashed, user_id))
        conn.commit()
    return {"message": "Password reset successfully"}


# ── Market Management ──────────────────────────────────────────────────────────

@router.get("/markets")
def admin_list_markets(_: dict = Depends(require_admin)):
    """Return all markets with stats for admin management."""
    with get_snowflake_connection() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                m.market_code,
                m.market_name,
                COUNT(DISTINCT p.id)   AS post_count,
                COUNT(DISTINCT c.id)   AS comment_count
            FROM markets m
            LEFT JOIN posts    p ON p.market_code = m.market_code
            LEFT JOIN comments c ON c.market_code = m.market_code
            GROUP BY m.market_code, m.market_name
            ORDER BY m.market_code
        """)
        rows = cur.fetchall()
    return [
        {"code": r[0], "name": r[1], "post_count": r[2], "comment_count": r[3]}
        for r in rows
    ]


@router.delete("/markets/{market_code}", status_code=status.HTTP_200_OK)
def delete_market(market_code: str, _: dict = Depends(require_admin)):
    """Delete a market and ALL associated data (comments → posts → campaigns → market)."""
    with get_snowflake_connection() as conn:
        cur = conn.cursor()

        # Resolve the exact stored market_code with a case-insensitive lookup
        cur.execute(
            "SELECT market_code FROM markets WHERE UPPER(market_code) = UPPER(%s)",
            (market_code,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Market '{market_code}' not found")

        # Use the exact case as stored in the DB for all subsequent operations
        exact_code = row[0]

        # Cascade: comments (FK on market_code)
        cur.execute("DELETE FROM comments WHERE market_code = %s", (exact_code,))

        # Cascade: posts (FK on market_code)
        cur.execute("DELETE FROM posts WHERE market_code = %s", (exact_code,))

        # Cascade: campaigns tied to this market (if market_code column exists on campaigns)
        try:
            cur.execute("DELETE FROM campaigns WHERE market_code = %s", (exact_code,))
        except Exception:
            pass  # campaigns table may not have market_code — safe to skip

        # Finally delete the market itself
        cur.execute("DELETE FROM markets WHERE market_code = %s", (exact_code,))
        conn.commit()

    # Bust the cached markets list so the next dashboard fetch is fresh
    dashboard_module._markets_cache["data"] = None
    dashboard_module._markets_cache["ts"] = 0
    # Also clear the general data cache
    dashboard_module._cache.clear()

    return {"message": f"Market '{exact_code}' and all associated data deleted successfully"}
