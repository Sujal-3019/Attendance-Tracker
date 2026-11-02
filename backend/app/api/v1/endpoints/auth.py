from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user
from app.api.deps import get_db
from app.models.user import User
from app.schemas.auth import (
    AdminRegistrationRequest,
    AdminRegistrationResponse,
    AdminRegistrationStatus,
    AuthResponse,
    EmployeeRegistrationRequest,
    LoginRequest,
    UserPublic,
)
from app.services.auth import (
    admin_registration_available,
    authenticate,
    register_admin,
    register_employee,
)


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> AuthResponse:
    return authenticate(db, payload)


@router.get("/admin-registration/status", response_model=AdminRegistrationStatus)
def admin_registration_status(
    db: Annotated[Session, Depends(get_db)],
) -> AdminRegistrationStatus:
    return AdminRegistrationStatus(available=admin_registration_available(db))


@router.post(
    "/register/admin",
    response_model=AdminRegistrationResponse,
    status_code=201,
)
def register_first_admin(
    payload: AdminRegistrationRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AdminRegistrationResponse:
    return register_admin(db, payload)


@router.post("/register/employee", response_model=AuthResponse, status_code=201)
def register(
    payload: EmployeeRegistrationRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    return register_employee(db, payload)


@router.get("/me", response_model=UserPublic)
def current_user(user: Annotated[User, Depends(get_current_user)]) -> UserPublic:
    return UserPublic(
        id=user.id,
        name=user.full_name,
        email=user.email,
        role=user.role,
        organization_id=user.organization_id,
        employee_id=user.employee_id,
        profile_complete=(
            user.employee.profile_complete if user.employee is not None else True
        ),
    )
