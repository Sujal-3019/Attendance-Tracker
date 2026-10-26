from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user, require_roles
from app.api.deps import get_db
from app.models.employee import Employee
from app.models.payroll import SalaryAdvance
from app.models.user import User
from app.schemas.payroll import (
    AdvanceRepaymentCreate,
    AdvanceRepaymentRule,
    OvertimeDecision,
    SalaryAdvanceCreate,
)
from app.services import payroll as payroll_service


router = APIRouter(tags=["payroll"])
AdminUser = Annotated[User, Depends(require_roles("admin"))]
AuthenticatedUser = Annotated[User, Depends(get_current_user)]


def selected_period(month: int | None, year: int | None) -> str:
    now = datetime.now(UTC)
    selected_month = month or now.month
    selected_year = year or now.year
    return f"{selected_year:04d}-{selected_month:02d}"


@router.get("/payroll/employees")
def get_payroll_employees(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020, le=2100),
) -> dict:
    return payroll_service.payroll_overview(
        db, user.organization_id, selected_period(month, year)
    )


@router.get("/payroll/summary")
def get_payroll_summary(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020, le=2100),
) -> dict:
    return payroll_service.payroll_summary(
        db, user.organization_id, selected_period(month, year)
    )


@router.get("/payroll/employees/{employee_id}")
def get_employee_payroll(
    employee_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020, le=2100),
) -> dict:
    overview = payroll_service.payroll_overview(
        db, user.organization_id, selected_period(month, year)
    )
    item = next((row for row in overview["items"] if row["employeeId"] == employee_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Employee payroll record not found")
    return item


@router.post("/payroll/employees/{employee_id}/finalize")
def finalize_payroll(
    employee_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020, le=2100),
) -> None:
    employee = db.scalar(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.organization_id == user.organization_id,
        )
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    payroll_service.finalize_payroll_not_ready()


@router.get("/me/payroll")
def get_my_payroll(
    user: AuthenticatedUser, db: Annotated[Session, Depends(get_db)]
) -> list[dict]:
    return payroll_service.my_payroll(db, user)


@router.get("/me/payroll/projection")
def get_my_salary_projection(
    user: AuthenticatedUser, db: Annotated[Session, Depends(get_db)]
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
        "available": False,
        "reason": "Projection requires confirmed payroll policies and attendance data.",
        "wageModel": employee.wage_model,
        "baseWage": employee.base_wage,
    }


@router.get("/me/payroll/{payslip_id}")
def get_my_payslip(
    payslip_id: UUID,
    user: AuthenticatedUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return payroll_service.my_payslip(db, user, payslip_id)


@router.get("/advances")
def get_advances(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    employee_id: UUID | None = Query(None),
) -> list[dict]:
    if employee_id:
        employee = db.scalar(
            select(Employee.id).where(
                Employee.id == employee_id,
                Employee.organization_id == user.organization_id,
            )
        )
        if employee is None:
            raise HTTPException(status_code=404, detail="Employee not found")
    return payroll_service.list_advances(db, user.organization_id, employee_id)


@router.get("/me/advances")
def get_my_advances(
    user: AuthenticatedUser, db: Annotated[Session, Depends(get_db)]
) -> list[dict]:
    if user.employee_id is None:
        raise HTTPException(status_code=403, detail="An employee profile is required")
    return payroll_service.list_advances(db, user.organization_id, user.employee_id)


@router.post("/advances", status_code=status.HTTP_201_CREATED)
def create_advance(
    payload: SalaryAdvanceCreate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return payroll_service.create_advance(db, user.organization_id, payload)


@router.post("/advances/{advance_id}/repayments")
def record_advance_repayment(
    advance_id: UUID,
    payload: AdvanceRepaymentCreate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=8, max_length=100)],
) -> dict:
    return payroll_service.record_repayment(
        db, user.organization_id, advance_id, payload, idempotency_key
    )


@router.post("/advances/{advance_id}/settle")
def settle_advance(
    advance_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return payroll_service.settle_advance(db, user.organization_id, advance_id, user)


@router.patch("/advances/{advance_id}/repayment-rule")
def update_repayment_rule(
    advance_id: UUID,
    payload: AdvanceRepaymentRule,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return payroll_service.update_repayment_rule(
        db, user.organization_id, advance_id, payload
    )


@router.get("/overtime/requests")
def get_overtime_requests(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    overtime_status: str | None = Query(None, alias="status", pattern="^(Pending|Approved|Rejected)$"),
) -> list[dict]:
    from app.models.payroll import OvertimeRequest

    statement = (
        select(OvertimeRequest, Employee)
        .join(Employee, Employee.id == OvertimeRequest.employee_id)
        .where(OvertimeRequest.organization_id == user.organization_id)
    )
    if overtime_status:
        statement = statement.where(OvertimeRequest.status == overtime_status)
    rows = db.execute(statement.order_by(OvertimeRequest.created_at.desc())).all()
    return [
        {
            "id": request.id,
            "employeeId": employee.id,
            "employeeCode": employee.employee_code,
            "employeeName": employee.full_name,
            "department": employee.department,
            "attendanceDate": request.attendance_date,
            "overtimeHours": request.hours,
            "overtimeStatus": request.status,
            "reason": request.reason,
            "reviewNote": request.review_note,
            "reviewedAt": request.reviewed_at,
            "calculatedOvertimePay": request.calculated_pay,
        }
        for request, employee in rows
    ]


@router.get("/overtime/requests/{request_id}")
def get_overtime_request(
    request_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    from app.models.payroll import OvertimeRequest

    row = db.execute(
        select(OvertimeRequest, Employee)
        .join(Employee, Employee.id == OvertimeRequest.employee_id)
        .where(
            OvertimeRequest.id == request_id,
            OvertimeRequest.organization_id == user.organization_id,
        )
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Overtime request not found")
    request, employee = row
    return {
        "id": request.id,
        "employeeId": employee.id,
        "employeeCode": employee.employee_code,
        "employeeName": employee.full_name,
        "department": employee.department,
        "attendanceDate": request.attendance_date,
        "overtimeHours": request.hours,
        "overtimeStatus": request.status,
        "reason": request.reason,
        "reviewNote": request.review_note,
        "reviewedAt": request.reviewed_at,
        "calculatedOvertimePay": request.calculated_pay,
    }


def decide_overtime(
    request_id: UUID,
    payload: OvertimeDecision,
    user: User,
    db: Session,
    *,
    approve: bool,
) -> dict:
    from app.models.payroll import OvertimeRequest

    request = db.scalar(
        select(OvertimeRequest)
        .where(
            OvertimeRequest.id == request_id,
            OvertimeRequest.organization_id == user.organization_id,
        )
        .with_for_update()
    )
    if request is None:
        raise HTTPException(status_code=404, detail="Overtime request not found")
    if request.status != "Pending":
        raise HTTPException(status_code=409, detail="Only pending overtime requests can be reviewed")
    if approve and payload.overtime_hours is None:
        raise HTTPException(status_code=422, detail="Approved overtime hours are required")
    request.status = "Approved" if approve else "Rejected"
    request.hours = payload.overtime_hours if approve else 0
    request.review_note = payload.review_note.strip()
    request.reviewer_user_id = user.id
    request.reviewed_at = datetime.now(UTC)
    db.commit()
    db.refresh(request)
    return {
        "id": request.id,
        "overtimeHours": request.hours,
        "overtimeStatus": request.status,
        "reviewNote": request.review_note,
        "reviewedAt": request.reviewed_at,
        "calculatedOvertimePay": request.calculated_pay,
    }


@router.post("/overtime/requests/{request_id}/approve")
def approve_overtime(
    request_id: UUID,
    payload: OvertimeDecision,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return decide_overtime(request_id, payload, user, db, approve=True)


@router.post("/overtime/requests/{request_id}/reject")
def reject_overtime(
    request_id: UUID,
    payload: OvertimeDecision,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return decide_overtime(request_id, payload, user, db, approve=False)
