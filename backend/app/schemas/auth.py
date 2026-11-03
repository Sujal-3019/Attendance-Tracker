from uuid import UUID

from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import ApiSchema


class LoginRequest(ApiSchema):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_login_identifier(cls, value: str) -> str:
        value = value.strip()
        if "@" not in value and not value.replace("+", "").replace(" ", "").isdigit():
            raise ValueError("Enter a valid email address or phone number")
        return value


class EmployeeRegistrationRequest(ApiSchema):
    organization_code: str = Field(min_length=4, max_length=100)
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(pattern="^[6-9]\\d{9}$")
    password: str = Field(min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return normalized


class AdminRegistrationRequest(ApiSchema):
    setup_code: str = Field(min_length=32, max_length=128)
    organization_name: str = Field(min_length=2, max_length=100)
    organization_type: Literal["office", "factory", "retail", "field", "other"]
    country: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(pattern="^[6-9]\\d{9}$")
    password: str = Field(min_length=8, max_length=128)

    @field_validator("country", "state")
    @classmethod
    def normalize_jurisdiction(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Country and state must be at least 2 characters")
        return normalized


class UserPublic(ApiSchema):
    id: UUID
    name: str
    email: EmailStr
    role: str
    organization_id: UUID
    employee_id: UUID | None
    profile_complete: bool = True


class AuthResponse(ApiSchema):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic
    organization: dict


class AdminRegistrationResponse(AuthResponse):
    employee_enrollment_code: str


class AdminRegistrationStatus(ApiSchema):
    available: bool
