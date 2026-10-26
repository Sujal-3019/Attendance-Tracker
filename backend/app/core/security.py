from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from app.core.config import get_settings


password_hasher = PasswordHasher()
TOKEN_ISSUER = "attendance-tracker-api"


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_access_token(user_id: UUID) -> tuple[str, int]:
    settings = get_settings()
    lifetime_seconds = settings.access_token_expire_minutes * 60
    now = datetime.now(UTC)
    claims = {
        "sub": str(user_id),
        "iss": TOKEN_ISSUER,
        "iat": now,
        "exp": now + timedelta(seconds=lifetime_seconds),
    }
    token = jwt.encode(claims, settings.jwt_secret_key.get_secret_value(), algorithm="HS256")
    return token, lifetime_seconds


def decode_access_token(token: str) -> UUID:
    settings = get_settings()
    claims = jwt.decode(
        token,
        settings.jwt_secret_key.get_secret_value(),
        algorithms=["HS256"],
        issuer=TOKEN_ISSUER,
        options={"require": ["exp", "iat", "sub", "iss"]},
    )
    return UUID(claims["sub"])
