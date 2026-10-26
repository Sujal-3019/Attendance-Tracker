from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveLedgerEntry, LeaveRequest, LeaveType
from app.models.user import User
from app.schemas.leave import LeaveApply, LeaveTypeCreate, LeaveTypeUpdate


def _request_values(request: LeaveRequest, employee: Employee, leave_type: LeaveType, reviewer: str | None) -> dict:
    return {
        "id": request.id,
        "employeeId": employee.id,
        "employeeName": employee.full_name,
        "employeeEmail": employee.email,
        "department": employee.department,
        "leaveType": leave_type.name,
        "type": leave_type.name,
        "startDate": request.start_date,
        "endDate": request.end_date,
        "days": request.requested_days,
        "reason": request.reason,
        "status": request.status,
        "appliedOn": request.created_at.date() if request.created_at else date.today(),
        "reviewedOn": request.decision_at,
        "reviewedBy": reviewer,
        "rejectionReason": request.decision_reason,
    }


def _type_values(item: LeaveType) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "code": item.code,
        "description": item.description,
        "annualAllocation": item.annual_allocation,
        "paid": item.paid,
        "carryForward": item.carry_forward,
        "maxConsecutiveDays": item.max_consecutive_days,
        "status": "Active" if item.is_active else "Inactive",
    }


def _leave_join_query(organization_id: UUID):
    return (
        select(LeaveRequest, Employee, LeaveType, User.full_name)
        .join(Employee, Employee.id == LeaveRequest.employee_id)
        .join(LeaveType, LeaveType.id == LeaveRequest.leave_type_id)
        .outerjoin(User, User.id == LeaveRequest.decision_user_id)
        .where(LeaveRequest.organization_id == organization_id)
    )


def list_requests(
    db: Session,
    organization_id: UUID,
    *,
    page: int,
    page_size: int,
    status_filter: str | None = None,
    search: str | None = None,
) -> dict:
    statement = _leave_join_query(organization_id)
    if status_filter:
        statement = statement.where(LeaveRequest.status == status_filter)
    if search:
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(Employee.full_name.ilike(term), LeaveType.name.ilike(term), Employee.department.ilike(term))
        )
    count_query = select(func.count()).select_from(statement.subquery())
    total = db.scalar(count_query) or 0
    rows = db.execute(
        statement.order_by(LeaveRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    items = [_request_values(request, employee, leave_type, reviewer) for request, employee, leave_type, reviewer in rows]
    return {"items": items, "total": total, "page": page, "pageSize": page_size}


def get_request(db: Session, organization_id: UUID, request_id: UUID) -> dict:
    row = db.execute(
        _leave_join_query(organization_id).where(LeaveRequest.id == request_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Leave request not found")
    request, employee, leave_type, reviewer = row
    return _request_values(request, employee, leave_type, reviewer)


def my_requests(db: Session, user: User) -> dict:
    if user.employee_id is None:
        raise HTTPException(status_code=403, detail="An employee profile is required")
    rows = db.execute(
        _leave_join_query(user.organization_id)
        .where(LeaveRequest.employee_id == user.employee_id)
        .order_by(LeaveRequest.created_at.desc())
    ).all()
    requests = [_request_values(request, employee, leave_type, reviewer) for request, employee, leave_type, reviewer in rows]
    balances = get_employee_balances(db, user.organization_id, user.employee_id)
    return {"balances": balances, "requests": requests}


def create_request(db: Session, user: User, payload: LeaveApply) -> dict:
    if user.employee_id is None:
        raise HTTPException(status_code=403, detail="An employee profile is required")
    start_date, end_date = payload.start_date, payload.end_date
    today = datetime.now(UTC).date()
    if start_date < today:
        raise HTTPException(status_code=422, detail="Leave start date cannot be in the past")
    if end_date < start_date:
        raise HTTPException(status_code=422, detail="End date cannot be before start date")
    if start_date.year != end_date.year:
        raise HTTPException(status_code=422, detail="Leave requests cannot span calendar years")

    employee = db.scalar(
        select(Employee)
        .where(
            Employee.id == user.employee_id,
            Employee.organization_id == user.organization_id,
            Employee.status == "Active",
        )
        .with_for_update()
    )
    if employee is None:
        raise HTTPException(status_code=403, detail="Active employee profile required")
    leave_type = db.scalar(
        select(LeaveType).where(
            LeaveType.organization_id == user.organization_id,
            func.lower(LeaveType.name) == payload.leave_type.strip().lower(),
            LeaveType.is_active.is_(True),
        )
    )
    if leave_type is None:
        raise HTTPException(status_code=422, detail="Select an active leave type")

    days = Decimal((end_date - start_date).days + 1)
    if days > leave_type.max_consecutive_days:
        raise HTTPException(status_code=422, detail="Requested duration exceeds the leave type limit")
    overlap = db.scalar(
        select(LeaveRequest.id).where(
            LeaveRequest.organization_id == user.organization_id,
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status.in_(["Pending", "Approved"]),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        ).limit(1)
    )
    if overlap:
        raise HTTPException(status_code=409, detail="An active leave request overlaps these dates")
    request = LeaveRequest(
        organization_id=user.organization_id,
        employee_id=employee.id,
        leave_type_id=leave_type.id,
        start_date=start_date,
        end_date=end_date,
        requested_days=days,
        reason=payload.reason.strip(),
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return _request_values(request, employee, leave_type, None)


def get_employee_balances(db: Session, organization_id: UUID, employee_id: UUID) -> list[dict]:
    year = datetime.now(UTC).year
    rows = db.execute(
        select(LeaveType, LeaveBalance)
        .outerjoin(
            LeaveBalance,
            (LeaveBalance.leave_type_id == LeaveType.id)
            & (LeaveBalance.employee_id == employee_id)
            & (LeaveBalance.balance_year == year),
        )
        .where(
            LeaveType.organization_id == organization_id,
            LeaveType.is_active.is_(True),
        )
        .order_by(LeaveType.name)
    ).all()
    result = []
    for leave_type, balance in rows:
        allocated = Decimal(leave_type.annual_allocation if leave_type.paid else 0)
        used = balance.used_days if balance else Decimal("0")
        result.append(
            {
                "type": leave_type.name,
                "code": leave_type.code,
                "allowance": allocated,
                "used": used,
                "remaining": allocated - used,
                "paymentType": "Paid" if leave_type.paid else "Unpaid",
            }
        )
    return result


def get_all_balances(db: Session, organization_id: UUID) -> list[dict]:
    employees = db.scalars(
        select(Employee).where(
            Employee.organization_id == organization_id,
            Employee.status == "Active",
        )
    ).all()
    return [
        {
            "employeeId": employee.id,
            "employeeName": employee.full_name,
            "balances": get_employee_balances(db, organization_id, employee.id),
        }
        for employee in employees
    ]


def decide_request(
    db: Session,
    organization_id: UUID,
    request_id: UUID,
    reviewer: User,
    *,
    approve: bool,
    reason: str | None,
) -> dict:
    request = db.scalar(
        select(LeaveRequest)
        .where(
            LeaveRequest.id == request_id,
            LeaveRequest.organization_id == organization_id,
        )
        .with_for_update()
    )
    if request is None:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if request.status != "Pending":
        raise HTTPException(status_code=409, detail="Only pending leave requests can be decided")
    employee = db.get(Employee, request.employee_id)
    leave_type = db.get(LeaveType, request.leave_type_id)
    if employee is None or leave_type is None:
        raise HTTPException(status_code=409, detail="Leave request references unavailable records")
    if approve:
        if not leave_type.is_active:
            raise HTTPException(status_code=409, detail="Leave type is inactive")
        if request.requested_days > leave_type.max_consecutive_days:
            raise HTTPException(status_code=409, detail="Request exceeds the current leave type limit")
        if leave_type.paid:
            year = request.start_date.year
            balance = db.scalar(
                select(LeaveBalance)
                .where(
                    LeaveBalance.employee_id == employee.id,
                    LeaveBalance.leave_type_id == leave_type.id,
                    LeaveBalance.balance_year == year,
                )
                .with_for_update()
            )
            if balance is None:
                try:
                    with db.begin_nested():
                        balance = LeaveBalance(
                            organization_id=organization_id,
                            employee_id=employee.id,
                            leave_type_id=leave_type.id,
                            balance_year=year,
                            allocated_days=Decimal(leave_type.annual_allocation),
                            used_days=Decimal("0"),
                        )
                        db.add(balance)
                        db.flush()
                except IntegrityError:
                    balance = db.scalar(
                        select(LeaveBalance)
                        .where(
                            LeaveBalance.employee_id == employee.id,
                            LeaveBalance.leave_type_id == leave_type.id,
                            LeaveBalance.balance_year == year,
                        )
                        .with_for_update()
                    )
            if balance is None or balance.used_days + request.requested_days > balance.allocated_days:
                db.rollback()
                raise HTTPException(status_code=409, detail="Insufficient leave balance")
            balance.used_days += request.requested_days
            db.add(
                LeaveLedgerEntry(
                    organization_id=organization_id,
                    employee_id=employee.id,
                    leave_type_id=leave_type.id,
                    leave_request_id=request.id,
                    entry_type="approved",
                    days=request.requested_days,
                )
            )
        request.status = "Approved"
        request.decision_reason = None
    else:
        if not reason or not reason.strip():
            raise HTTPException(status_code=422, detail="A rejection reason is required")
        request.status = "Rejected"
        request.decision_reason = reason.strip()
    request.decision_user_id = reviewer.id
    request.decision_at = datetime.now(UTC)
    db.commit()
    db.refresh(request)
    return _request_values(request, employee, leave_type, reviewer.full_name)


def list_types(db: Session, organization_id: UUID, include_inactive: bool = True) -> list[dict]:
    statement = select(LeaveType).where(LeaveType.organization_id == organization_id)
    if not include_inactive:
        statement = statement.where(LeaveType.is_active.is_(True))
    return [_type_values(item) for item in db.scalars(statement.order_by(LeaveType.name)).all()]


def get_type(db: Session, organization_id: UUID, type_id: UUID) -> dict:
    item = db.scalar(
        select(LeaveType).where(
            LeaveType.id == type_id,
            LeaveType.organization_id == organization_id,
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Leave type not found")
    return _type_values(item)


def create_type(db: Session, organization_id: UUID, payload: LeaveTypeCreate) -> dict:
    item = LeaveType(
        organization_id=organization_id,
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        description=payload.description.strip(),
        annual_allocation=payload.annual_allocation,
        paid=payload.paid,
        carry_forward=payload.carry_forward,
        max_consecutive_days=payload.max_consecutive_days,
    )
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Leave type code already exists") from None
    db.refresh(item)
    return _type_values(item)


def update_type(
    db: Session, organization_id: UUID, type_id: UUID, payload: LeaveTypeUpdate
) -> dict:
    item = db.scalar(
        select(LeaveType).where(
            LeaveType.id == type_id, LeaveType.organization_id == organization_id
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Leave type not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return _type_values(item)


def update_type_status(db: Session, organization_id: UUID, type_id: UUID, active: bool) -> dict:
    item = db.scalar(
        select(LeaveType).where(
            LeaveType.id == type_id, LeaveType.organization_id == organization_id
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Leave type not found")
    item.is_active = active
    db.commit()
    db.refresh(item)
    return _type_values(item)


def leave_stats(db: Session, organization_id: UUID) -> dict:
    rows = db.execute(
        select(LeaveRequest.status, func.count(LeaveRequest.id), func.sum(LeaveRequest.requested_days))
        .where(LeaveRequest.organization_id == organization_id)
        .group_by(LeaveRequest.status)
    ).all()
    counts = {name: count for name, count, _ in rows}
    approved_days = sum((days or Decimal("0")) for name, _, days in rows if name == "Approved")
    return {
        "total": sum(counts.values()),
        "pending": counts.get("Pending", 0),
        "approved": counts.get("Approved", 0),
        "rejected": counts.get("Rejected", 0),
        "totalDaysApproved": approved_days,
    }
