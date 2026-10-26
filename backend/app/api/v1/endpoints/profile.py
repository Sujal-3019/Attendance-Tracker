from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user
from app.api.deps import get_db
from app.models.employee import Employee
from app.models.user import User


router = APIRouter(prefix="/me", tags=["employee profile"])


class ProfileUpdate(BaseModel):
    phone: str = Field(min_length=10, max_length=20)


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
    employee.phone = payload.phone.strip()
    user.phone = employee.phone
    db.commit()
    return get_profile(user, db)
