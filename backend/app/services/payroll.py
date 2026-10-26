from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.payroll import AdvanceRepayment, PayrollSnapshot, SalaryAdvance
from app.models.user import User
from app.schemas.payroll import (
    AdvanceRepaymentCreate,
    AdvanceRepaymentRule,
    SalaryAdvanceCreate,
)


def _period_date(period: str) -> date:
    try:
        return date.fromisoformat(f"{period}-01")
    except ValueError:
        raise HTTPException(status_code=422, detail="Period must use YYYY-MM format") from None


def _repayment_totals(db: Session, advance_ids: list[UUID]) -> dict[UUID, dict[str, Decimal]]:
    if not advance_ids:
        return {}
    rows = db.execute(
        select(
            AdvanceRepayment.advance_id,
            func.sum(AdvanceRepayment.amount),
            func.sum(
                case(
                    (AdvanceRepayment.method == "Direct repayment", AdvanceRepayment.amount),
                    (AdvanceRepayment.method == "Manual settlement", AdvanceRepayment.amount),
                    else_=Decimal("0"),
                )
            ),
            func.sum(
                case(
                    (AdvanceRepayment.method == "Payroll deduction", AdvanceRepayment.amount),
                    else_=Decimal("0"),
                )
            ),
        )
        .where(AdvanceRepayment.advance_id.in_(advance_ids))
        .group_by(AdvanceRepayment.advance_id)
    ).all()
    return {
        advance_id: {
            "total": total or Decimal("0"),
            "direct": direct or Decimal("0"),
            "payroll": payroll or Decimal("0"),
        }
        for advance_id, total, direct, payroll in rows
    }


def _advance_values(advance: SalaryAdvance, employee: Employee, totals: dict) -> dict:
    paid = totals.get("total", Decimal("0"))
    outstanding = max(Decimal("0"), advance.original_amount - paid)
    return {
        "id": advance.id,
        "employeeId": employee.id,
        "employeeCode": employee.employee_code,
        "employeeName": employee.full_name,
        "department": employee.department,
        "originalAmount": advance.original_amount,
        "directRepayments": totals.get("direct", Decimal("0")),
        "payrollRepayments": totals.get("payroll", Decimal("0")),
        "monthlyDeduction": advance.monthly_deduction,
        "startMonth": advance.start_month.strftime("%Y-%m"),
        "status": "Repaid" if outstanding == 0 else advance.status,
        "reason": advance.reason,
        "createdAt": advance.created_at.date() if advance.created_at else None,
        "outstandingBalance": outstanding,
        "totalRepaid": paid,
    }


def _advance_repayments(db: Session, advance_id: UUID) -> list[dict]:
    records = db.scalars(
        select(AdvanceRepayment)
        .where(AdvanceRepayment.advance_id == advance_id)
        .order_by(AdvanceRepayment.date.desc(), AdvanceRepayment.created_at.desc())
    ).all()
    return [
        {
            "id": item.id,
            "date": item.date,
            "amount": item.amount,
            "method": item.method,
            "note": item.note,
        }
        for item in records
    ]


def list_advances(
    db: Session, organization_id: UUID, employee_id: UUID | None = None
) -> list[dict]:
    statement = (
        select(SalaryAdvance, Employee)
        .join(Employee, Employee.id == SalaryAdvance.employee_id)
        .where(SalaryAdvance.organization_id == organization_id)
    )
    if employee_id:
        statement = statement.where(SalaryAdvance.employee_id == employee_id)
    rows = db.execute(statement.order_by(SalaryAdvance.created_at.desc())).all()
    totals = _repayment_totals(db, [advance.id for advance, _ in rows])
    return [
        {**_advance_values(advance, employee, totals.get(advance.id, {})), "repayments": _advance_repayments(db, advance.id)}
        for advance, employee in rows
    ]


def create_advance(db: Session, organization_id: UUID, payload: SalaryAdvanceCreate) -> dict:
    employee = db.scalar(
        select(Employee).where(
            Employee.id == payload.employee_id,
            Employee.organization_id == organization_id,
            Employee.status == "Active",
        )
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Active employee not found")
    if payload.monthly_deduction > payload.original_amount:
        raise HTTPException(status_code=422, detail="Monthly deduction cannot exceed the advance amount")
    advance = SalaryAdvance(
        organization_id=organization_id,
        employee_id=employee.id,
        original_amount=payload.original_amount,
        monthly_deduction=payload.monthly_deduction,
        start_month=_period_date(payload.start_month),
        reason=payload.reason.strip(),
    )
    db.add(advance)
    db.commit()
    db.refresh(advance)
    return {**_advance_values(advance, employee, {}), "repayments": []}


def _find_advance(db: Session, organization_id: UUID, advance_id: UUID, *, lock: bool) -> tuple[SalaryAdvance, Employee]:
    statement = (
        select(SalaryAdvance, Employee)
        .join(Employee, Employee.id == SalaryAdvance.employee_id)
        .where(
            SalaryAdvance.id == advance_id,
            SalaryAdvance.organization_id == organization_id,
        )
    )
    if lock:
        statement = statement.with_for_update(of=SalaryAdvance)
    result = db.execute(statement).first()
    if result is None:
        raise HTTPException(status_code=404, detail="Salary advance not found")
    return result


def record_repayment(
    db: Session,
    organization_id: UUID,
    advance_id: UUID,
    payload: AdvanceRepaymentCreate,
    idempotency_key: str,
) -> dict:
    advance, employee = _find_advance(db, organization_id, advance_id, lock=True)
    previous = db.scalar(
        select(AdvanceRepayment).where(
            AdvanceRepayment.advance_id == advance_id,
            AdvanceRepayment.idempotency_key == idempotency_key,
        )
    )
    if previous:
        totals = _repayment_totals(db, [advance_id]).get(advance_id, {})
        return {
            **_advance_values(advance, employee, totals),
            "repayments": _advance_repayments(db, advance_id),
        }
    totals = _repayment_totals(db, [advance_id]).get(advance_id, {})
    outstanding = advance.original_amount - totals.get("total", Decimal("0"))
    if advance.status != "Active" or outstanding <= 0:
        raise HTTPException(status_code=409, detail="Salary advance is already settled")
    if payload.amount > outstanding:
        raise HTTPException(status_code=422, detail="Repayment exceeds the outstanding balance")
    repayment = AdvanceRepayment(
        advance_id=advance.id,
        amount=payload.amount,
        date=payload.payment_date or datetime.now(UTC).date(),
        method=payload.method,
        note=payload.note.strip(),
        idempotency_key=idempotency_key,
    )
    db.add(repayment)
    if payload.amount == outstanding:
        advance.status = "Repaid"
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Repayment has already been recorded") from None
    totals = _repayment_totals(db, [advance_id]).get(advance_id, {})
    return {
        **_advance_values(advance, employee, totals),
        "repayments": _advance_repayments(db, advance_id),
    }


def settle_advance(db: Session, organization_id: UUID, advance_id: UUID, user: User) -> dict:
    advance, employee = _find_advance(db, organization_id, advance_id, lock=True)
    totals = _repayment_totals(db, [advance_id]).get(advance_id, {})
    outstanding = advance.original_amount - totals.get("total", Decimal("0"))
    if advance.status != "Active" or outstanding <= 0:
        raise HTTPException(status_code=409, detail="Salary advance is already settled")
    db.add(
        AdvanceRepayment(
            advance_id=advance.id,
            amount=outstanding,
            date=datetime.now(UTC).date(),
            method="Manual settlement",
            note=f"Settled by administrator {user.id}",
            idempotency_key=f"settlement:{advance.id}",
        )
    )
    advance.status = "Repaid"
    db.commit()
    totals = _repayment_totals(db, [advance_id]).get(advance_id, {})
    return {
        **_advance_values(advance, employee, totals),
        "repayments": _advance_repayments(db, advance_id),
    }


def update_repayment_rule(
    db: Session,
    organization_id: UUID,
    advance_id: UUID,
    payload: AdvanceRepaymentRule,
) -> dict:
    advance, employee = _find_advance(db, organization_id, advance_id, lock=True)
    totals = _repayment_totals(db, [advance_id]).get(advance_id, {})
    outstanding = advance.original_amount - totals.get("total", Decimal("0"))
    if advance.status != "Active":
        raise HTTPException(status_code=409, detail="Only active salary advances can be updated")
    if payload.monthly_deduction > outstanding:
        raise HTTPException(status_code=422, detail="Monthly deduction cannot exceed outstanding balance")
    advance.monthly_deduction = payload.monthly_deduction
    advance.start_month = _period_date(payload.start_month)
    db.commit()
    db.refresh(advance)
    return {**_advance_values(advance, employee, totals), "repayments": _advance_repayments(db, advance_id)}


def payroll_overview(db: Session, organization_id: UUID, period: str) -> dict:
    _period_date(period)
    rows = db.execute(
        select(Employee, PayrollSnapshot)
        .outerjoin(
            PayrollSnapshot,
            (PayrollSnapshot.employee_id == Employee.id)
            & (PayrollSnapshot.period == period),
        )
        .where(
            Employee.organization_id == organization_id,
            Employee.status == "Active",
        )
        .order_by(Employee.full_name)
    ).all()
    items = []
    for employee, snapshot in rows:
        if snapshot:
            items.append(
                {
                    **snapshot.calculation_snapshot,
                    "employeeId": employee.id,
                    "employeeCode": employee.employee_code,
                    "name": employee.full_name,
                    "department": employee.department,
                    "wageModel": employee.wage_model,
                    "baseWage": employee.base_wage,
                    "payrollMonth": period,
                    "payrollStatus": "Finalized",
                    "finalizedAt": snapshot.finalized_at,
                    "grossEarnings": snapshot.gross_amount,
                    "totalDeductions": snapshot.total_deductions,
                    "netPay": snapshot.net_amount,
                }
            )
        else:
            items.append(
                {
                    "employeeId": employee.id,
                    "employeeCode": employee.employee_code,
                    "name": employee.full_name,
                    "department": employee.department,
                    "wageModel": employee.wage_model,
                    "baseWage": employee.base_wage,
                    "payrollMonth": period,
                    "payrollStatus": "Needs Review",
                    "grossEarnings": None,
                    "totalDeductions": None,
                    "netPay": None,
                }
            )
    return {"items": items, "total": len(items), "period": period}


def payroll_summary(db: Session, organization_id: UUID, period: str) -> dict:
    _period_date(period)
    rows = db.execute(
        select(
            func.count(PayrollSnapshot.id),
            func.coalesce(func.sum(PayrollSnapshot.net_amount), 0),
            func.coalesce(func.sum(PayrollSnapshot.gross_amount), 0),
            func.coalesce(func.sum(PayrollSnapshot.total_deductions), 0),
        ).where(
            PayrollSnapshot.organization_id == organization_id,
            PayrollSnapshot.period == period,
        )
    ).one()
    employees = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.organization_id == organization_id,
            Employee.status == "Active",
        )
    ) or 0
    finalized, net, gross, deductions = rows
    return {
        "totalEmployees": employees,
        "finalizedEmployees": finalized,
        "needsReview": employees - finalized,
        "totalPayroll": net,
        "totalGross": gross,
        "totalDeductions": deductions,
        "totalOvertime": None,
    }


def finalize_payroll_not_ready() -> None:
    raise HTTPException(
        status_code=409,
        detail="Payroll finalization is disabled until attendance, wage, deduction, and overtime rules are confirmed.",
    )


def my_payroll(db: Session, user: User) -> list[dict]:
    if user.employee_id is None:
        raise HTTPException(status_code=403, detail="An employee profile is required")
    snapshots = db.scalars(
        select(PayrollSnapshot)
        .where(
            PayrollSnapshot.organization_id == user.organization_id,
            PayrollSnapshot.employee_id == user.employee_id,
        )
        .order_by(PayrollSnapshot.period.desc())
    ).all()
    return [
        {
            **snapshot.calculation_snapshot,
            "id": snapshot.id,
            "payrollMonth": snapshot.period,
            "grossEarnings": snapshot.gross_amount,
            "totalDeductions": snapshot.total_deductions,
            "netPay": snapshot.net_amount,
            "finalizedAt": snapshot.finalized_at,
            "payrollStatus": "Finalized",
        }
        for snapshot in snapshots
    ]


def my_payslip(db: Session, user: User, payslip_id: UUID) -> dict:
    snapshot = db.scalar(
        select(PayrollSnapshot).where(
            PayrollSnapshot.id == payslip_id,
            PayrollSnapshot.organization_id == user.organization_id,
            PayrollSnapshot.employee_id == user.employee_id,
        )
    )
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return {
        **snapshot.calculation_snapshot,
        "id": snapshot.id,
        "payrollMonth": snapshot.period,
        "grossEarnings": snapshot.gross_amount,
        "totalDeductions": snapshot.total_deductions,
        "netPay": snapshot.net_amount,
        "finalizedAt": snapshot.finalized_at,
        "payrollStatus": "Finalized",
    }
