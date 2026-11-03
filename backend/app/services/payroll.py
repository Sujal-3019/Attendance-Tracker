import calendar
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceRecord
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveType
from app.models.organization import Organization, OrganizationSettings
from app.models.payroll import (
    AdvanceRepayment,
    OvertimeRequest,
    PayrollSnapshot,
    SalaryAdvance,
)
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


CENT = Decimal("0.01")
OT_MULTIPLIER = Decimal("1.5")


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def _money_json(value: Decimal | None) -> float | None:
    return float(_money(value)) if value is not None else None


def _payroll_context(db: Session, organization_id: UUID) -> tuple[dict, date, dict]:
    settings = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == organization_id
        )
    )
    attendance_policy = settings.attendance_policy if settings else {}
    profile = settings.organization_profile if settings else {}
    if not attendance_policy.get("workingDays"):
        raise HTTPException(
            status_code=409,
            detail="Configure the organization's working days before calculating payroll.",
        )
    timezone = ZoneInfo(profile.get("timezone", "UTC"))
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return (
        attendance_policy,
        datetime.now(UTC).astimezone(timezone).date(),
        {"country": organization.country, "state": organization.state},
    )


def _scheduled_days(start: date, end: date, weekdays: set[int]) -> list[date]:
    if end < start:
        return []
    return [
        start + timedelta(days=offset)
        for offset in range((end - start).days + 1)
        if (start + timedelta(days=offset)).weekday() in weekdays
    ]


def _advance_installments(
    db: Session, employee_id: UUID, period: str, available_net: Decimal
) -> list[tuple[SalaryAdvance, Decimal]]:
    period_start = _period_date(period)
    advances = db.scalars(
        select(SalaryAdvance)
        .where(
            SalaryAdvance.employee_id == employee_id,
            SalaryAdvance.status == "Active",
            SalaryAdvance.start_month <= period_start,
        )
        .order_by(SalaryAdvance.created_at, SalaryAdvance.id)
    ).all()
    totals = _repayment_totals(db, [advance.id for advance in advances])
    remaining_pay = max(Decimal("0"), available_net)
    deductions: list[tuple[SalaryAdvance, Decimal]] = []
    for advance in advances:
        paid = totals.get(advance.id, {}).get("total", Decimal("0"))
        outstanding = max(Decimal("0"), advance.original_amount - paid)
        amount = min(advance.monthly_deduction, outstanding, remaining_pay)
        if amount > 0:
            deductions.append((advance, _money(amount)))
            remaining_pay -= amount
    return deductions


def _calculate_employee_period(
    db: Session, organization_id: UUID, employee: Employee, period: str
) -> dict:
    period_start = _period_date(period)
    year, month = period_start.year, period_start.month
    period_end = date(year, month, calendar.monthrange(year, month)[1])
    attendance_policy, local_today, jurisdiction = _payroll_context(db, organization_id)
    working_day_names = attendance_policy["workingDays"]
    weekdays = {
        index
        for index, name in enumerate(
            ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
        )
        if name in working_day_names
    }
    if not weekdays:
        raise HTTPException(status_code=409, detail="At least one working day is required.")

    month_days = _scheduled_days(period_start, period_end, weekdays)
    employed_month_days = [day for day in month_days if day >= employee.joining_date]
    elapsed_end = min(period_end, local_today)
    period_days = [
        day
        for day in employed_month_days
        if day <= elapsed_end
    ]
    period_is_closed = period_end <= local_today
    min_hours = Decimal(str(attendance_policy.get("minimumWorkingHours", 0)))

    attendance = db.scalars(
        select(AttendanceRecord).where(
            AttendanceRecord.organization_id == organization_id,
            AttendanceRecord.employee_id == employee.id,
            AttendanceRecord.attendance_date >= period_start,
            AttendanceRecord.attendance_date <= period_end,
        )
    ).all()
    attendance_by_day = {item.attendance_date: item for item in attendance}
    worked_days = {
        day
        for day in period_days
        if (record := attendance_by_day.get(day)) is not None
        and record.status in {"Present", "Late", "Correction"}
    }
    missing_hours = [
        day
        for day in worked_days
        if attendance_by_day[day].worked_hours is None
    ]

    leave_rows = db.execute(
        select(LeaveRequest, LeaveType)
        .join(LeaveType, LeaveType.id == LeaveRequest.leave_type_id)
        .where(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= period_end,
            LeaveRequest.end_date >= period_start,
        )
    ).all()
    leave_paid_by_day: dict[date, bool] = {}
    for request, leave_type in leave_rows:
        leave_start = max(request.start_date, period_start, employee.joining_date)
        leave_end = min(request.end_date, period_end, elapsed_end)
        for leave_day in _scheduled_days(leave_start, leave_end, weekdays):
            if leave_day not in worked_days:
                leave_paid_by_day[leave_day] = (
                    leave_paid_by_day.get(leave_day, True) and leave_type.paid
                )

    paid_leave_days = {
        day for day, is_paid in leave_paid_by_day.items() if is_paid
    }
    unpaid_leave_days = {
        day for day, is_paid in leave_paid_by_day.items() if not is_paid
    }
    absent_days = set(period_days) - worked_days - set(leave_paid_by_day)
    open_attendance = [
        item
        for item in attendance
        if item.attendance_date in period_days
        and item.check_in is not None
        and item.check_out is None
        and item.status in {"Present", "Late", "Correction"}
    ]

    base_wage = Decimal(employee.base_wage or 0)
    full_month_days = len(month_days)
    employed_days = len(employed_month_days)
    daily_rate = base_wage / full_month_days if full_month_days else Decimal("0")
    if employee.wage_model == "Monthly":
        base_pay = base_wage * employed_days / full_month_days if full_month_days else Decimal("0")
        absence_deduction = daily_rate * len(absent_days)
        unpaid_leave_deduction = daily_rate * len(unpaid_leave_days)
        hourly_rate = (
            base_wage / full_month_days / min_hours
            if full_month_days and min_hours > 0
            else Decimal("0")
        )
    elif employee.wage_model == "Daily":
        base_pay = base_wage * (len(worked_days) + len(paid_leave_days))
        absence_deduction = Decimal("0")
        unpaid_leave_deduction = Decimal("0")
        hourly_rate = base_wage / min_hours if min_hours > 0 else Decimal("0")
    else:
        worked_hours = sum(
            (
                Decimal(record.worked_hours or 0)
                for day, record in attendance_by_day.items()
                if day in worked_days
            ),
            Decimal("0"),
        )
        base_pay = base_wage * (worked_hours + min_hours * len(paid_leave_days))
        absence_deduction = Decimal("0")
        unpaid_leave_deduction = Decimal("0")
        hourly_rate = base_wage

    overtime_rows = db.scalars(
        select(OvertimeRequest).where(
            OvertimeRequest.organization_id == organization_id,
            OvertimeRequest.employee_id == employee.id,
            OvertimeRequest.attendance_date >= period_start,
            OvertimeRequest.attendance_date <= period_end,
            OvertimeRequest.status == "Approved",
        )
    ).all()
    overtime_hours = sum((Decimal(item.hours) for item in overtime_rows), Decimal("0"))
    overtime_pay = overtime_hours * hourly_rate * OT_MULTIPLIER
    gross = _money(base_pay + overtime_pay)
    attendance_deductions = _money(absence_deduction + unpaid_leave_deduction)
    advances = _advance_installments(
        db, employee.id, period, max(Decimal("0"), gross - attendance_deductions)
    )
    advance_deduction = _money(sum((amount for _, amount in advances), Decimal("0")))
    deductions = _money(attendance_deductions + advance_deduction)
    net = _money(max(Decimal("0"), gross - deductions))
    warnings = []
    if employee.joining_date > period_end:
        warnings.append("Employee had not joined during the selected payroll period.")
    if base_wage <= 0:
        warnings.append("Salary has not been configured.")
    if open_attendance:
        warnings.append("Resolve open attendance check-outs before finalizing payroll.")
    if employee.wage_model == "Hourly" and missing_hours:
        warnings.append("Resolve attendance records with missing worked hours before finalizing hourly payroll.")
    if employee.wage_model == "Hourly" and min_hours <= 0:
        warnings.append("Configure minimum working hours before calculating hourly pay.")
    if overtime_hours > 0 and min_hours <= 0 and employee.wage_model != "Hourly":
        warnings.append("Configure minimum working hours before calculating overtime pay.")

    statutory = {
        "incomeTaxTds": None,
        "epf": None,
        "esi": None,
        "professionalTax": None,
        "status": "Not calculated",
        "reason": "FY 2026-27 TDS rates and employer statutory coverage have not been verified/configured.",
        **jurisdiction,
    }
    return {
        "employeeId": employee.id,
        "employeeCode": employee.employee_code,
        "name": employee.full_name,
        "department": employee.department,
        "wageModel": employee.wage_model,
        "baseWage": employee.base_wage,
        "payrollMonth": period,
        "payrollStatus": "Period Open" if not period_is_closed else ("Needs Review" if warnings else "Estimate"),
        "periodOpen": not period_is_closed,
        "canFinalize": period_is_closed and not warnings,
        "warnings": warnings,
        "daysWorked": len(worked_days),
        "workingDays": len(employed_month_days),
        "paidLeaveDays": len(paid_leave_days),
        "unpaidLeaveDays": len(unpaid_leave_days),
        "absentDays": len(absent_days),
        "overtimeHours": _money_json(overtime_hours),
        "overtimePay": _money_json(overtime_pay),
        "basicEarnings": _money_json(base_pay),
        "grossEarnings": _money_json(gross),
        "baseDeductions": _money_json(attendance_deductions),
        "absenceDeduction": _money_json(_money(absence_deduction)),
        "unpaidLeaveDeduction": _money_json(_money(unpaid_leave_deduction)),
        "advanceDeductions": _money_json(advance_deduction),
        "totalDeductions": _money_json(deductions),
        "netPay": _money_json(net),
        "taxRegime": employee.tax_regime,
        "statutoryDeductions": statutory,
        "statutoryTaxesCalculated": False,
        "basicSalary": _money_json(employee.basic_salary),
        "dearnessAllowance": _money_json(employee.dearness_allowance),
        "hra": _money_json(employee.house_rent_allowance),
        "allowances": _money_json(employee.other_allowances),
        "deductions": _money_json(deductions),
        "_advanceInstallments": advances,
    }


def _public_payroll(item: dict, snapshot: PayrollSnapshot | None = None) -> dict:
    values = {key: value for key, value in item.items() if key != "_advanceInstallments"}
    if snapshot is not None:
        values.update(
            {
                **snapshot.calculation_snapshot,
                "id": snapshot.id,
                "employeeId": item["employeeId"],
                "employeeCode": item["employeeCode"],
                "name": item["name"],
                "department": item["department"],
                "wageModel": item["wageModel"],
                "baseWage": item["baseWage"],
                "payrollMonth": snapshot.period,
                "payrollStatus": "Finalized",
                "finalizedAt": snapshot.finalized_at,
                "grossEarnings": snapshot.gross_amount,
                "totalDeductions": snapshot.total_deductions,
                "netPay": snapshot.net_amount,
                "deductions": snapshot.total_deductions,
            }
        )
    return values


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
    items = [
        _public_payroll(
            _calculate_employee_period(db, organization_id, employee, period),
            snapshot,
        )
        for employee, snapshot in rows
    ]
    return {"items": items, "total": len(items), "period": period}


def payroll_summary(db: Session, organization_id: UUID, period: str) -> dict:
    _period_date(period)
    overview = payroll_overview(db, organization_id, period)
    items = overview["items"]
    finalized = sum(item["payrollStatus"] == "Finalized" for item in items)
    return {
        "totalEmployees": len(items),
        "finalizedEmployees": finalized,
        "needsReview": sum(item["payrollStatus"] == "Needs Review" for item in items),
        "totalPayroll": sum(float(item["netPay"] or 0) for item in items),
        "totalGross": sum(float(item["grossEarnings"] or 0) for item in items),
        "totalDeductions": sum(float(item["totalDeductions"] or 0) for item in items),
        "totalOvertime": sum(float(item["overtimePay"] or 0) for item in items),
        "statutoryTaxesCalculated": False,
    }


def finalize_payroll(
    db: Session, organization_id: UUID, employee_id: UUID, period: str, user: User
) -> dict:
    employee = db.scalar(
        select(Employee)
        .where(
            Employee.id == employee_id,
            Employee.organization_id == organization_id,
            Employee.status == "Active",
        )
        .with_for_update()
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Active employee not found")
    existing = db.scalar(
        select(PayrollSnapshot).where(
            PayrollSnapshot.organization_id == organization_id,
            PayrollSnapshot.employee_id == employee_id,
            PayrollSnapshot.period == period,
        )
    )
    if existing is not None:
        return _public_payroll(
            _calculate_employee_period(db, organization_id, employee, period), existing
        )

    calculated = _calculate_employee_period(db, organization_id, employee, period)
    if not calculated["canFinalize"]:
        reason = "; ".join(calculated["warnings"])
        if calculated["periodOpen"]:
            reason = "The payroll period is still open."
        raise HTTPException(
            status_code=409,
            detail=reason or "Payroll cannot be finalized until review items are resolved.",
        )
    installments = calculated.pop("_advanceInstallments")
    finalized_at = datetime.now(UTC)
    snapshot_data = {
        key: value
        for key, value in calculated.items()
        if key not in {"employeeId", "employeeCode", "name", "department", "payrollStatus", "periodOpen", "canFinalize", "warnings", "baseWage", "wageModel"}
    }
    snapshot_data["advanceInstallments"] = [
        {"advanceId": str(advance.id), "amount": float(amount)}
        for advance, amount in installments
    ]
    period_start = _period_date(period)
    period_end = date(
        period_start.year,
        period_start.month,
        calendar.monthrange(period_start.year, period_start.month)[1],
    )
    snapshot = PayrollSnapshot(
        organization_id=organization_id,
        employee_id=employee_id,
        period=period,
        gross_amount=Decimal(str(calculated["grossEarnings"])),
        total_deductions=Decimal(str(calculated["totalDeductions"])),
        net_amount=Decimal(str(calculated["netPay"])),
        calculation_snapshot=snapshot_data,
        finalized_by=user.id,
        finalized_at=finalized_at,
    )
    db.add(snapshot)
    for advance, amount in installments:
        db.add(
            AdvanceRepayment(
                advance_id=advance.id,
                amount=amount,
                date=period_end,
                method="Payroll deduction",
                note=f"Automatic payroll installment for {period}",
                idempotency_key=f"payroll:{advance.id}:{period}",
                payroll_period=period,
            )
        )
        paid = _repayment_totals(db, [advance.id]).get(advance.id, {}).get("total", Decimal("0"))
        if paid + amount >= advance.original_amount:
            advance.status = "Repaid"
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(PayrollSnapshot).where(
                PayrollSnapshot.organization_id == organization_id,
                PayrollSnapshot.employee_id == employee_id,
                PayrollSnapshot.period == period,
            )
        )
        if existing is None:
            raise HTTPException(status_code=409, detail="Payroll could not be finalized.") from None
        return _public_payroll(
            _calculate_employee_period(db, organization_id, employee, period), existing
        )
    db.refresh(snapshot)
    return _public_payroll(calculated | {"_advanceInstallments": installments}, snapshot)


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
        _payslip_values(snapshot)
        for snapshot in snapshots
    ]


def _payslip_values(snapshot: PayrollSnapshot) -> dict:
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
    return _payslip_values(snapshot)


def update_tax_regime(db: Session, user: User, regime: str) -> dict:
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
    employee.tax_regime = regime
    db.commit()
    return {"taxRegime": employee.tax_regime, "taxStatus": "Not calculated"}
