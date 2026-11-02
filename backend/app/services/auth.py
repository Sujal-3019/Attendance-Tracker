import secrets
from datetime import UTC, datetime
from uuid import uuid4
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveType
from app.models.organization import Organization
from app.models.payroll import Notification
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
        profile_complete=(
            user.employee.profile_complete if user.employee is not None else True
        ),
    )


def lock_first_admin_registration(db: Session) -> None:
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        db.execute(
            text("SELECT pg_advisory_xact_lock(:lock_id)"),
            {"lock_id": ADMIN_REGISTRATION_LOCK_ID},
        )


def authenticate(db: Session, payload: LoginRequest) -> AuthResponse:
    identifier = payload.email.strip()
    if "@" in identifier:
        matches = db.scalars(
            select(User).where(func.lower(User.email) == identifier.lower())
        ).all()
        user = matches[0] if len(matches) == 1 else None
    else:
        phone = "".join(character for character in identifier if character.isdigit())
        if len(phone) == 12 and phone.startswith("91"):
            phone = phone[2:]
        matches = db.scalars(select(User).where(User.phone == phone)).all()
        user = matches[0] if len(matches) == 1 else None
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

    admins = db.scalars(
        select(User).where(
            User.organization_id == organization.id,
            User.role == "admin",
            User.is_active.is_(True),
        )
    ).all()
    if not admins:
        raise HTTPException(
            status_code=409,
            detail="Employee registration is temporarily unavailable",
        )

    email = str(payload.email).lower()
    employee = db.scalar(
        select(Employee).where(
            Employee.organization_id == organization.id,
            func.lower(Employee.email) == email,
        )
    )
    if employee is not None:
        raise HTTPException(status_code=409, detail="An account already exists for this email")
    duplicate_phone = db.scalar(
        select(User.id).where(
            User.organization_id == organization.id,
            User.phone == payload.phone,
        )
    )
    if duplicate_phone is None:
        duplicate_phone = db.scalar(
            select(Employee.id).where(
                Employee.organization_id == organization.id,
                Employee.phone == payload.phone,
            )
        )
    if duplicate_phone is not None:
        raise HTTPException(status_code=409, detail="An account already exists for this phone number")

    employee_id = uuid4()
    employee = Employee(
        id=employee_id,
        organization_id=organization.id,
        employee_code=f"PENDING-{employee_id.hex[:8].upper()}",
        full_name=payload.full_name.strip(),
        email=email,
        phone=payload.phone,
        department="Pending setup",
        designation="Pending setup",
        manager="",
        employment_type="Pending setup",
        work_mode="Pending setup",
        work_location=None,
        joining_date=datetime.now(UTC).date(),
        status="Active",
        profile_complete=False,
        wage_model="Monthly",
        base_wage=0,
    )
    db.add(employee)
    db.flush()
    for leave_type in db.scalars(
        select(LeaveType).where(
            LeaveType.organization_id == organization.id,
            LeaveType.is_active.is_(True),
        )
    ).all():
        db.add(
            LeaveBalance(
                organization_id=organization.id,
                employee_id=employee.id,
                leave_type_id=leave_type.id,
                balance_year=datetime.now(UTC).year,
                allocated_days=0,
                used_days=0,
            )
        )
    user = User(
        organization_id=organization.id,
        employee_id=employee.id,
        email=email,
        full_name=employee.full_name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role="employee",
    )
    db.add(user)
    for admin in admins:
        db.add(
            Notification(
                organization_id=organization.id,
                user_id=admin.id,
                title="Complete new employee profile",
                message=f"A new employee registered with {email}. Add their employee ID, role, salary, leave allocation, and reporting details.",
                category="EMPLOYEE_ONBOARDING",
                action_url=f"/employees/{employee.id}/edit",
                related_employee_id=employee.id,
            )
        )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account already exists for this email or phone") from None
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
