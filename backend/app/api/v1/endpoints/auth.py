"""Auth endpoints — login, register, refresh."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from jose import jwt
import uuid

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token, UserResponse
from app.core.config import settings
from app.core.security import hash_password, verify_password

router = APIRouter()


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


class LoginRequest:
    from pydantic import BaseModel
    class Model(BaseModel):
        email: str
        password: str
        role: str = "citizen"
        city: str = "Gurugram"
        city_sector: str = "Sector-45"


from pydantic import BaseModel

class LoginIn(BaseModel):
    email: str
    password: str

class RegisterIn(BaseModel):
    email: str
    password: str
    role: str = "citizen"
    city: str = "Gurugram"
    city_sector: str = "Sector-45"
    age_group: str | None = None


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterIn, db: AsyncSession = Depends(get_db)):
    """Register a new user. Returns JWT."""
    auth_id = uuid.uuid4()
    user = User(
        auth_id=auth_id,
        role=data.role,
        city=data.city,
        city_sector=data.city_sector,
        age_group=data.age_group,
    )
    db.add(user)
    await db.commit()
    token = create_access_token(str(auth_id))
    return Token(access_token=token)


@router.post("/login", response_model=Token)
async def login(data: LoginIn, db: AsyncSession = Depends(get_db)):
    """
    Demo login — any email/password combo works in dev mode.
    In production, wire to Supabase Auth.
    """
    # Dev mode: create or fetch user by email hash
    fake_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, data.email)
    result = await db.execute(select(User).where(User.auth_id == fake_uuid))
    user = result.scalar_one_or_none()
    if not user:
        user = User(auth_id=fake_uuid, role="citizen", city="Gurugram", city_sector="Sector-45")
        db.add(user)
        await db.commit()
    token = create_access_token(str(fake_uuid))
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(db: AsyncSession = Depends(get_db)):
    """Placeholder — returns demo user. Hook to JWT in production."""
    result = await db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No users found — run seed.py first")
    return user
