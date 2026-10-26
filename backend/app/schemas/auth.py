from uuid import UUID

from typing import Literal

from pydantic import EmailStr, Field

from app.schemas.common import ApiSchema


class LoginRequest(ApiSchema):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class EmployeeRegistrationRequest(ApiSchema):
    organization_code: str = Field(min_length=4, max_length=100)
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=8, max_length=128)


class AdminRegistrationRequest(ApiSchema):
    setup_code: str = Field(min_length=32, max_length=128)
    organization_name: str = Field(min_length=2, max_length=100)
    organization_type: Literal["office", "factory", "retail", "field", "other"]
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(pattern="^[6-9]\\d{9}$")
    password: str = Field(min_length=8, max_length=128)


class UserPublic(ApiSchema):
    id: UUID
    name: str
    email: EmailStr
    role: str
    organization_id: UUID
    employee_id: UUID | None


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
