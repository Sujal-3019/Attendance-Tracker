from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.auth_deps import require_roles
from app.api.deps import get_db
from app.models.user import User
from app.schemas.settings import (
    AttendancePolicy,
    CompanyCodePublic,
    OrganizationProfile,
    PayrollPolicy,
    WorkLocationCreate,
    WorkLocationPublic,
    WorkLocationStatus,
    WorkLocationUpdate,
)
from app.services import settings as settings_service


router = APIRouter(prefix="/settings", tags=["settings"])
AdminUser = Annotated[User, Depends(require_roles("admin"))]


@router.post("/company-code", response_model=CompanyCodePublic)
def create_company_code(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.generate_company_code(db, user.organization_id)


@router.get("/organization")
def get_organization(user: AdminUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    return settings_service.get_organization_profile(db, user.organization_id)


@router.patch("/organization")
def update_organization(
    payload: OrganizationProfile,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.update_organization_profile(db, user.organization_id, payload)


@router.get("/attendance-policy")
def get_attendance_policy(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.get_policy(db, user.organization_id, "attendance_policy")


@router.put("/attendance-policy")
def set_attendance_policy(
    payload: AttendancePolicy,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.update_attendance_policy(db, user.organization_id, payload)


@router.get("/payroll-policy")
def get_payroll_policy(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.get_policy(db, user.organization_id, "payroll_policy")


@router.put("/payroll-policy")
def set_payroll_policy(
    payload: PayrollPolicy,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.update_payroll_policy(db, user.organization_id, payload)


@router.get("/work-locations", response_model=list[WorkLocationPublic])
def get_work_locations(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    return settings_service.list_work_locations(db, user.organization_id)


@router.post("/work-locations", response_model=WorkLocationPublic, status_code=status.HTTP_201_CREATED)
def create_work_location(
    payload: WorkLocationCreate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.create_work_location(db, user.organization_id, payload)


@router.patch("/work-locations/{location_id}", response_model=WorkLocationPublic)
def update_work_location(
    location_id: UUID,
    payload: WorkLocationUpdate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.update_work_location(
        db, user.organization_id, location_id, payload
    )


@router.patch("/work-locations/{location_id}/status", response_model=WorkLocationPublic)
def update_work_location_status(
    location_id: UUID,
    payload: WorkLocationStatus,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return settings_service.update_work_location_status(
        db, user.organization_id, location_id, payload.status == "Active"
    )
