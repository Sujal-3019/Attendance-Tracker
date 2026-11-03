import secrets
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.organization import Organization, OrganizationSettings, WorkLocation
from app.schemas.settings import (
    AttendancePolicy,
    OrganizationProfile,
    PayrollPolicy,
    WorkLocationCreate,
    WorkLocationUpdate,
)


def _settings_record(db: Session, organization_id: UUID) -> OrganizationSettings:
    record = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == organization_id
        )
    )
    if record is None:
        record = OrganizationSettings(organization_id=organization_id)
        db.add(record)
        db.flush()
    return record


def get_organization_profile(db: Session, organization_id: UUID) -> dict:
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    record = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == organization_id
        )
    )
    profile = {
        "organizationName": organization.name,
        "organizationEmail": "",
        "phone": "",
        "address": "",
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "dateFormat": "DD/MM/YYYY",
    }
    if record and record.organization_profile:
        profile.update(record.organization_profile)
    return {
        **profile,
        "country": organization.country or "",
        "state": organization.state or "",
    }


def update_organization_profile(
    db: Session, organization_id: UUID, payload: OrganizationProfile
) -> dict:
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    profile = payload.model_dump(by_alias=True)
    organization.name = payload.organization_name
    organization.country = payload.country.strip()
    organization.state = payload.state.strip()
    record = _settings_record(db, organization_id)
    record.organization_profile = profile
    db.commit()
    return profile


def get_policy(db: Session, organization_id: UUID, policy_name: str) -> dict:
    record = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == organization_id
        )
    )
    value = getattr(record, policy_name) if record else None
    if policy_name == "payroll_policy":
        defaults = PayrollPolicy().model_dump(by_alias=True)
        return {**defaults, **(value or {})}
    return value or {}


def generate_company_code(db: Session, organization_id: UUID) -> dict:
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    company_code = secrets.token_urlsafe(12)
    organization.enrollment_code_hash = hash_password(company_code)
    db.commit()
    return {"companyCode": company_code}


def update_attendance_policy(
    db: Session, organization_id: UUID, payload: AttendancePolicy
) -> dict:
    policy = payload.model_dump(by_alias=True)
    record = _settings_record(db, organization_id)
    record.attendance_policy = policy
    db.commit()
    return policy


def update_payroll_policy(db: Session, organization_id: UUID, payload: PayrollPolicy) -> dict:
    policy = payload.model_dump(by_alias=True)
    record = _settings_record(db, organization_id)
    record.payroll_policy = policy
    db.commit()
    return policy


def list_work_locations(db: Session, organization_id: UUID) -> list[dict]:
    locations = db.scalars(
        select(WorkLocation)
        .where(WorkLocation.organization_id == organization_id)
        .order_by(WorkLocation.is_primary.desc(), WorkLocation.name)
    ).all()
    return [_location_values(item) for item in locations]


def _location_values(item: WorkLocation) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "address": item.address,
        "latitude": float(item.latitude),
        "longitude": float(item.longitude),
        "radiusMeters": item.radius_meters,
        "primary": item.is_primary,
        "status": "Active" if item.is_active else "Inactive",
    }


def create_work_location(
    db: Session, organization_id: UUID, payload: WorkLocationCreate
) -> dict:
    if payload.primary:
        db.query(WorkLocation).filter(
            WorkLocation.organization_id == organization_id
        ).update({WorkLocation.is_primary: False})
    item = WorkLocation(
        organization_id=organization_id,
        name=payload.name.strip(),
        address=payload.address.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_meters=payload.radius_meters,
        is_primary=payload.primary,
    )
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Unable to save work location") from None
    db.refresh(item)
    return _location_values(item)


def update_work_location(
    db: Session, organization_id: UUID, location_id: UUID, payload: WorkLocationUpdate
) -> dict:
    item = db.scalar(
        select(WorkLocation).where(
            WorkLocation.id == location_id,
            WorkLocation.organization_id == organization_id,
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Work location not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("primary"):
        db.query(WorkLocation).filter(
            WorkLocation.organization_id == organization_id,
            WorkLocation.id != location_id,
        ).update({WorkLocation.is_primary: False})
    mapping = {"primary": "is_primary"}
    for key, value in updates.items():
        setattr(item, mapping.get(key, key), value)
    db.commit()
    db.refresh(item)
    return _location_values(item)


def update_work_location_status(
    db: Session, organization_id: UUID, location_id: UUID, active: bool
) -> dict:
    item = db.scalar(
        select(WorkLocation).where(
            WorkLocation.id == location_id,
            WorkLocation.organization_id == organization_id,
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Work location not found")
    item.is_active = active
    db.commit()
    db.refresh(item)
    return _location_values(item)
