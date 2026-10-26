from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import Field
from sqlalchemy.orm import Session

from app.api.auth_deps import require_roles
from app.api.deps import get_db
from app.models.user import User
from app.schemas.common import ApiSchema
from app.schemas.employee import EmployeeCreate, EmployeePublic, EmployeeUpdate
from app.services import employees as employee_service


router = APIRouter(prefix="/employees", tags=["employees"])
AdminUser = Annotated[User, Depends(require_roles("admin"))]


class EmployeeAttendanceSummary(ApiSchema):
    present: int
    late: int


class EmployeeListItem(EmployeePublic):
    attendance: EmployeeAttendanceSummary


class EmployeePage(ApiSchema):
    items: list[EmployeeListItem]
    total: int
    page: int
    page_size: int


class EmployeeStatusUpdate(ApiSchema):
    status: str = Field(pattern="^(Active|Inactive)$")


@router.get("", response_model=EmployeePage)
def list_employees(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=100),
    department: str | None = Query(None, max_length=100),
    employee_status: str | None = Query(None, alias="status", pattern="^(Active|Inactive)$"),
) -> dict:
    return employee_service.list_employees(
        db,
        user.organization_id,
        page=page,
        page_size=page_size,
        search=search,
        department=department,
        status_filter=employee_status,
    )


@router.get("/summary")
def get_employee_summary(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, int]:
    return employee_service.employee_summary(db, user.organization_id)


@router.post("", response_model=EmployeePublic, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return employee_service.create_employee(db, user.organization_id, payload)


@router.get("/{employee_id}")
def get_employee(
    employee_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return employee_service.employee_details(db, user.organization_id, employee_id)


@router.patch("/{employee_id}", response_model=EmployeePublic)
def update_employee(
    employee_id: UUID,
    payload: EmployeeUpdate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return employee_service.update_employee(db, user.organization_id, employee_id, payload)


@router.patch("/{employee_id}/status", response_model=EmployeePublic)
def set_employee_status(
    employee_id: UUID,
    payload: EmployeeStatusUpdate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return employee_service.update_employee_status(
        db, user.organization_id, employee_id, payload.status
    )
