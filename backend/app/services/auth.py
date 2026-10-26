import secrets
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import (
    AdminRegistrationRequest,
    AdminRegistrationResponse,
    AuthResponse,
    EmployeeRegistrationRequest,
    LoginRequest,
    UserPublic,
)

ADMIN_REGISTRATION_LOCK_ID = 6842039175261041


def _user_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        name=user.full_name,
        email=user.email,
        role=user.role,
        organization_id=user.organization_id,
        employee_id=user.employee_id,
    )


def lock_first_admin_registration(db: Session) -> None:
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        db.execute(
            text("SELECT pg_advisory_xact_lock(:lock_id)"),
            {"lock_id": ADMIN_REGISTRATION_LOCK_ID},
        )


def authenticate(db: Session, payload: LoginRequest) -> AuthResponse:
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token, expires_in = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        expires_in=expires_in,
        user=_user_public(user),
        organization={
            "id": user.organization.id,
            "name": user.organization.name,
            "type": user.organization.organization_type,
        },
    )


def admin_registration_available(db: Session) -> bool:
    setup_code = get_settings().admin_setup_code
    if setup_code is None:
        return False
    return db.scalar(select(Organization.id).limit(1)) is None


def register_admin(
    db: Session, payload: AdminRegistrationRequest
) -> AdminRegistrationResponse:
    configured_code = get_settings().admin_setup_code
    if configured_code is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Administrator web registration is not enabled by the server operator",
        )
    if not secrets.compare_digest(
        payload.setup_code, configured_code.get_secret_value()
    ):
        raise HTTPException(status_code=403, detail="Invalid administrator setup code")

    lock_first_admin_registration(db)
    if db.scalar(select(Organization.id).limit(1)) is not None:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Administrator registration is closed because an organization already exists",
        )

    enrollment_code = secrets.token_urlsafe(24)
    organization = Organization(
        name=payload.organization_name.strip(),
        organization_type=payload.organization_type,
        enrollment_code_hash=hash_password(enrollment_code),
    )
    db.add(organization)
    db.flush()
    user = User(
        organization_id=organization.id,
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        phone=payload.phone.strip(),
        password_hash=hash_password(payload.password),
        role="admin",
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Unable to create the administrator account"
        ) from None
    db.refresh(user)
    token, expires_in = create_access_token(user.id)
    return AdminRegistrationResponse(
        access_token=token,
        expires_in=expires_in,
        user=_user_public(user),
        organization={
            "id": organization.id,
            "name": organization.name,
            "type": organization.organization_type,
        },
        employee_enrollment_code=enrollment_code,
    )


def register_employee(db: Session, payload: EmployeeRegistrationRequest) -> AuthResponse:
    organizations = db.scalars(select(Organization).where(Organization.is_active.is_(True))).all()
    organization = next(
        (
            item
            for item in organizations
            if verify_password(payload.organization_code, item.enrollment_code_hash)
        ),
        None,
    )
    if organization is None:
        raise HTTPException(status_code=400, detail="Invalid organization code")

    employee = db.scalar(
        select(Employee).where(
            Employee.organization_id == organization.id,
            func.lower(Employee.email) == payload.email.lower(),
        )
    )
    if employee is None or employee.status != "Active":
        raise HTTPException(status_code=403, detail="Employee enrollment is not available")
    if employee.user is not None:
        raise HTTPException(status_code=409, detail="An account already exists for this employee")
    if employee.full_name.casefold() != payload.full_name.strip().casefold() or employee.phone != payload.phone:
        raise HTTPException(status_code=403, detail="Employee details do not match the employee record")

    user = User(
        organization_id=organization.id,
        employee_id=employee.id,
        email=employee.email,
        full_name=employee.full_name,
        phone=employee.phone,
        password_hash=hash_password(payload.password),
        role="employee",
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account already exists for this employee") from None
    db.refresh(user)
    token, expires_in = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        expires_in=expires_in,
        user=_user_public(user),
        organization={
            "id": organization.id,
            "name": organization.name,
            "type": organization.organization_type,
        },
    )


def get_user_by_id(db: Session, user_id: UUID) -> User:
    return db.get(User, user_id)
