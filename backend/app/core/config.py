from functools import lru_cache
from pathlib import Path
from typing import Self

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: SecretStr
    jwt_secret_key: SecretStr
    admin_setup_code: SecretStr | None = None
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"
    access_token_expire_minutes: int = 15

    @field_validator("jwt_secret_key")
    @classmethod
    def validate_jwt_secret(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value()) < 32:
            raise ValueError("JWT_SECRET_KEY must contain at least 32 characters")
        return value

    @field_validator("admin_setup_code")
    @classmethod
    def validate_admin_setup_code(cls, value: SecretStr | None) -> SecretStr | None:
        if value is not None and not 32 <= len(value.get_secret_value()) <= 128:
            raise ValueError("ADMIN_SETUP_CODE must contain 32 to 128 characters")
        return value

    @field_validator("access_token_expire_minutes")
    @classmethod
    def validate_token_lifetime(cls, value: int) -> int:
        if not 1 <= value <= 60:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be between 1 and 60")
        return value

    @model_validator(mode="after")
    def validate_database_url(self) -> Self:
        url = make_url(self.database_url.get_secret_value())
        if url.get_backend_name() != "postgresql":
            raise ValueError("DATABASE_URL must use PostgreSQL")
        return self

    @property
    def sqlalchemy_database_url(self) -> str:
        url = make_url(self.database_url.get_secret_value())
        return url.set(drivername="postgresql+psycopg").render_as_string(
            hide_password=False
        )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
