import time
from datetime import date

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..config import JWT_SECRET, MIN_AGE_YEARS
from ..deps import get_db, require_user, token_payload
from ..schemas import LoginRequest, ProfileUpdate, RegisterRequest

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


def _age_from_dob(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, session: Session = Depends(get_db)):
    if payload.date_of_birth and _age_from_dob(payload.date_of_birth) < MIN_AGE_YEARS:
        raise HTTPException(403, f"You must be at least {MIN_AGE_YEARS} years old to register")
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


@router.patch("/me")
def update_me(
    payload: ProfileUpdate,
    user=Depends(require_user),
    session: Session = Depends(get_db),
):
    if _age_from_dob(payload.date_of_birth) < MIN_AGE_YEARS:
        raise HTTPException(403, f"You must be at least {MIN_AGE_YEARS} years old to order")
    params = {
        "id": user["sub"],
        "dob": payload.date_of_birth,
        "name": payload.full_name,
    }
    if payload.full_name:
        session.execute(
            text(
                "update profiles set date_of_birth=:dob, full_name=:name where id=:id"
            ),
            params,
        )
    else:
        session.execute(
            text("update profiles set date_of_birth=:dob where id=:id"),
            {"id": user["sub"], "dob": payload.date_of_birth},
        )
    session.commit()
    row = session.execute(
        text(
            "select id::text,email,full_name,role,date_of_birth::text "
            "from profiles where id=:id"
        ),
        {"id": user["sub"]},
    ).mappings().one()
    return dict(row)
