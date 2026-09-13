import time

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..config import JWT_SECRET
from ..deps import get_db, token_payload
from ..schemas import LoginRequest, RegisterRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


def issue_token(row):
    return jwt.encode(
        {
            "sub": str(row["id"]),
            "email": row["email"],
            "role": row["role"],
            "exp": int(time.time()) + 86400,
        },
        JWT_SECRET,
        algorithm="HS256",
    )


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, session: Session = Depends(get_db)):
    exists = session.execute(
        text("select id from profiles where lower(email)=lower(:email)"),
        {"email": payload.email},
    ).first()
    if exists:
        raise HTTPException(409, "Email already registered")
    row = session.execute(
        text(
            """insert into profiles(email,full_name,date_of_birth,password_hash)
            values (:email,:full_name,:date_of_birth,:password_hash)
            returning id::text,email,full_name,role,date_of_birth::text"""
        ),
        {
            **payload.model_dump(exclude={"password"}),
            "password_hash": bcrypt.hashpw(
                payload.password.encode(), bcrypt.gensalt()
            ).decode(),
        },
    ).mappings().one()
    session.commit()
    return {
        "access_token": issue_token(row),
        "token_type": "bearer",
        "user": dict(row),
    }


@router.post("/login")
def login(payload: LoginRequest, session: Session = Depends(get_db)):
    row = session.execute(
        text(
            "select id::text,email,full_name,role,date_of_birth::text,password_hash "
            "from profiles where lower(email)=lower(:email)"
        ),
        {"email": payload.email},
    ).mappings().first()
    if not row or not row["password_hash"] or not bcrypt.checkpw(
        payload.password.encode(), row["password_hash"].encode()
    ):
        raise HTTPException(401, "Invalid email or password")
    public = {k: row[k] for k in ("id", "email", "full_name", "role", "date_of_birth")}
    return {
        "access_token": issue_token(public),
        "token_type": "bearer",
        "user": public,
    }


@router.get("/me")
def me(payload=Depends(token_payload), session: Session = Depends(get_db)):
    row = session.execute(
        text(
            "select id::text,email,full_name,role,date_of_birth::text "
            "from profiles where id=:id"
        ),
        {"id": payload["sub"]},
    ).mappings().first()
    if not row:
        raise HTTPException(404, "User not found")
    return dict(row)
