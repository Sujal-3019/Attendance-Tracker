from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ConfigDict, Field, field_validator, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user
from app.api.deps import get_db
from app.models.employee import Employee
from app.models.user import User
from app.schemas.common import ApiSchema


router = APIRouter(prefix="/me", tags=["employee profile"])


class ProfileUpdate(ApiSchema):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, min_length=10, max_length=20)

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @model_validator(mode="after")
    def require_update(self):
        if self.full_name is None and self.phone is None:
            raise ValueError("Provide a name or phone number to update")
        return self


@router.get("/profile")
def get_profile(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    if user.employee_id is None:
        raise HTTPException(status_code=403, detail="An employee profile is required")
    employee = db.scalar(
        select(Employee).where(
            Employee.id == user.employee_id,
            Employee.organization_id == user.organization_id,
        )
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return {
        "employeeId": employee.employee_code,
        "fullName": employee.full_name,
        "email": employee.email,
        "phone": employee.phone,
        "department": employee.department,
        "designation": employee.designation,
        "employmentType": employee.employment_type,
        "joiningDate": employee.joining_date,
        "workMode": employee.work_mode,
        "manager": employee.manager,
        "profileComplete": employee.profile_complete,
    }


@router.patch("/profile")
def update_profile(
    payload: ProfileUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    if user.employee_id is None:
        raise HTTPException(status_code=403, detail="An employee profile is required")
    employee = db.scalar(
        select(Employee).where(
            Employee.id == user.employee_id,
            Employee.organization_id == user.organization_id,
        )
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    if payload.phone is not None:
        employee.phone = payload.phone.strip()
        user.phone = employee.phone
    if payload.full_name is not None:
        if employee.profile_complete or employee.full_name != "Pending employee":
            raise HTTPException(
                status_code=403,
                detail="Your name can only be set once during account setup",
            )
        employee.full_name = payload.full_name.strip()
        user.full_name = employee.full_name
    db.commit()
    return get_profile(user, db)
