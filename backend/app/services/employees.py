from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.models.payroll import Notification
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeLeaveAllocation, EmployeeUpdate


def _public_values(employee: Employee) -> dict:
    return {
        "id": employee.id,
        "employeeCode": employee.employee_code,
        "name": employee.full_name,
        "email": employee.email,
        "phone": employee.phone,
        "department": employee.department,
        "designation": employee.designation,
        "manager": employee.manager,
        "employmentType": employee.employment_type,
        "workMode": employee.work_mode,
        "location": employee.work_location,
        "joiningDate": employee.joining_date,
        "status": employee.status,
        "profileComplete": employee.profile_complete,
        "wageModel": employee.wage_model,
        "baseWage": employee.base_wage,
    }


def _apply_leave_allocations(
    db: Session,
    organization_id: UUID,
    employee: Employee,
    allocations: list[EmployeeLeaveAllocation],
) -> None:
    leave_type_ids = [item.leave_type_id for item in allocations]
    leave_types = (
        db.scalars(
            select(LeaveType).where(
                LeaveType.organization_id == organization_id,
                LeaveType.id.in_(leave_type_ids),
            )
        ).all()
        if leave_type_ids
        else []
    )
    if len(leave_types) != len(leave_type_ids):
        raise HTTPException(status_code=422, detail="One or more leave types are invalid")

    year = datetime.now(UTC).year
    for allocation in allocations:
        balance = db.scalar(
            select(LeaveBalance)
            .where(
                LeaveBalance.employee_id == employee.id,
                LeaveBalance.leave_type_id == allocation.leave_type_id,
                LeaveBalance.balance_year == year,
            )
            .with_for_update()
        )
        if balance is not None and balance.used_days > allocation.allocated_days:
            raise HTTPException(
                status_code=409,
                detail="Leave allocation cannot be lower than leave already used",
            )
        if balance is None:
            db.add(
                LeaveBalance(
                    organization_id=organization_id,
                    employee_id=employee.id,
                    leave_type_id=allocation.leave_type_id,
                    balance_year=year,
                    allocated_days=allocation.allocated_days,
                    used_days=0,
                )
            )
        else:
            balance.allocated_days = allocation.allocated_days
    db.flush()


def _profile_is_complete(db: Session, employee: Employee) -> bool:
    required_values = (
        employee.full_name,
        employee.department,
        employee.designation,
        employee.manager,
        employee.employment_type,
        employee.work_mode,
        employee.work_location,
        employee.employee_code,
    )
    if (
        any(not value or value == "Pending setup" for value in required_values)
        or employee.employee_code.startswith("PENDING-")
        or employee.base_wage <= 0
    ):
        return False

    active_leave_type_ids = set(
        db.scalars(
            select(LeaveType.id).where(
                LeaveType.organization_id == employee.organization_id,
                LeaveType.is_active.is_(True),
            )
        ).all()
    )
    if not active_leave_type_ids:
        return True

    balance_type_ids = set(
        db.scalars(
            select(LeaveBalance.leave_type_id).where(
                LeaveBalance.organization_id == employee.organization_id,
                LeaveBalance.employee_id == employee.id,
                LeaveBalance.balance_year == datetime.now(UTC).year,
                LeaveBalance.leave_type_id.in_(active_leave_type_ids),
            )
        ).all()
    )
    return active_leave_type_ids.issubset(balance_type_ids)


def list_employees(
    db: Session,
    organization_id: UUID,
    *,
    page: int,
    page_size: int,
    search: str | None,
    department: str | None,
    status_filter: str | None,
) -> dict:
    statement = select(Employee).where(Employee.organization_id == organization_id)
    if search:
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Employee.full_name.ilike(term),
                Employee.email.ilike(term),
                Employee.employee_code.ilike(term),
            )
        )
    if department:
        statement = statement.where(Employee.department == department)
    if status_filter:
        statement = statement.where(Employee.status == status_filter)

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = db.scalars(
        statement.order_by(Employee.full_name).offset((page - 1) * page_size).limit(page_size)
    ).all()
    current_date = datetime.now(UTC).date()
    month_start = date(current_date.year, current_date.month, 1)
    month_end = date(
        current_date.year + (current_date.month == 12),
        current_date.month % 12 + 1,
        1,
    )
    attendance_counts = {
        employee_id: {"present": 0, "late": 0}
        for employee_id in (item.id for item in items)
    }
    if attendance_counts:
        rows = db.execute(
            select(
                AttendanceRecord.employee_id,
                AttendanceRecord.status,
                func.count(AttendanceRecord.id),
            )
            .where(
                AttendanceRecord.organization_id == organization_id,
                AttendanceRecord.employee_id.in_(attendance_counts),
                AttendanceRecord.attendance_date >= month_start,
                AttendanceRecord.attendance_date < month_end,
            )
            .group_by(AttendanceRecord.employee_id, AttendanceRecord.status)
        ).all()
        for employee_id, attendance_status, count in rows:
            if attendance_status in {"Present", "Late"}:
                attendance_counts[employee_id][attendance_status.lower()] = count

    values = []
    for employee in items:
        employee_values = _public_values(employee)
        employee_values["attendance"] = attendance_counts[employee.id]
        values.append(employee_values)
    return {"items": values, "total": total, "page": page, "page_size": page_size}


def get_employee(db: Session, organization_id: UUID, employee_id: UUID) -> Employee:
    employee = db.scalar(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.organization_id == organization_id,
        )
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


def employee_details(db: Session, organization_id: UUID, employee_id: UUID) -> dict:
    employee = get_employee(db, organization_id, employee_id)
    attendance_rows = db.scalars(
        select(AttendanceRecord)
        .where(
            AttendanceRecord.organization_id == organization_id,
            AttendanceRecord.employee_id == employee_id,
        )
        .order_by(AttendanceRecord.attendance_date.desc())
        .limit(30)
    ).all()
    month_rows = [
        item
        for item in attendance_rows
        if item.attendance_date.year == datetime.now(UTC).year
        and item.attendance_date.month == datetime.now(UTC).month
    ]
    recent = [
        {
            "date": item.attendance_date,
            "checkIn": item.check_in.strftime("%I:%M %p") if item.check_in else "—",
            "checkOut": item.check_out.strftime("%I:%M %p") if item.check_out else "—",
            "workHours": f"{item.worked_hours}h" if item.worked_hours is not None else "—",
            "status": item.status,
        }
        for item in attendance_rows[:5]
    ]
    balance_rows = db.execute(
        select(LeaveType, LeaveBalance)
        .outerjoin(
            LeaveBalance,
            (LeaveBalance.leave_type_id == LeaveType.id)
            & (LeaveBalance.employee_id == employee_id)
            & (LeaveBalance.balance_year == datetime.now(UTC).year),
        )
        .where(LeaveType.organization_id == organization_id)
    ).all()
    leave_summary = {}
    leave_allocations = []
    for leave_type, balance in balance_rows:
        key = leave_type.code.lower()
        allocated = balance.allocated_days if balance else leave_type.annual_allocation
        used = balance.used_days if balance else 0
        leave_summary[key] = {
            "allocated": allocated,
            "used": used,
            "remaining": allocated - used,
        }
        leave_allocations.append(
            {
                "leaveTypeId": leave_type.id,
                "code": leave_type.code,
                "name": leave_type.name,
                "allocatedDays": allocated,
                "usedDays": used,
            }
        )
    approved_leave_days = db.scalar(
        select(func.coalesce(func.sum(LeaveRequest.requested_days), 0)).where(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status == "Approved",
        )
    ) or 0
    return {
        **_public_values(employee),
        "attendance": {
            "present": sum(item.status == "Present" for item in month_rows),
            "late": sum(item.status == "Late" for item in month_rows),
            "absent": None,
            "leave": None,
        },
        "recentAttendance": recent,
        "leaveSummary": leave_summary,
        "leaveAllocations": leave_allocations,
        "approvedLeaveDays": approved_leave_days,
    }


def create_employee(db: Session, organization_id: UUID, payload: EmployeeCreate) -> dict:
    employee = Employee(
        organization_id=organization_id,
        employee_code=payload.employee_code.strip(),
        full_name=payload.name.strip(),
        email=str(payload.email).lower(),
        phone=payload.phone.strip(),
        department=payload.department.strip(),
        designation=payload.designation.strip(),
        manager=payload.manager.strip(),
        employment_type=payload.employment_type,
        work_mode=payload.work_mode,
        work_location=payload.location,
        joining_date=payload.joining_date,
        status=payload.status,
        profile_complete=False,
        wage_model=payload.wage_model,
        base_wage=payload.base_wage,
    )
    db.add(employee)
    try:
        db.flush()
        db.add(
            User(
                organization_id=organization_id,
                employee_id=employee.id,
                email=employee.email,
                password_hash=hash_password(payload.password),
                full_name=employee.full_name,
                phone=employee.phone,
                role="employee",
                is_active=employee.status == "Active",
            )
        )
        _apply_leave_allocations(
            db, organization_id, employee, payload.leave_allocations
        )
        employee.profile_complete = _profile_is_complete(db, employee)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Employee code or email already exists") from None
    db.refresh(employee)
    return _public_values(employee)


def update_employee(
    db: Session, organization_id: UUID, employee_id: UUID, payload: EmployeeUpdate
) -> dict:
    employee = get_employee(db, organization_id, employee_id)
    updates = payload.model_dump(exclude_unset=True, by_alias=False)
    mapping = {"location": "work_location"}
    for key, value in updates.items():
        if key == "leave_allocations":
            continue
        attribute = mapping.get(key, key)
        setattr(employee, attribute, value)
        if employee.user is not None and attribute in {"email", "phone"}:
            setattr(employee.user, attribute, value)
    if employee.email:
        employee.email = str(employee.email).lower()
        if employee.user is not None:
            employee.user.email = employee.email
    if payload.leave_allocations is not None:
        _apply_leave_allocations(
            db, organization_id, employee, payload.leave_allocations
        )
    employee.profile_complete = _profile_is_complete(db, employee)
    if employee.profile_complete:
        db.query(Notification).filter(
            Notification.organization_id == organization_id,
            Notification.related_employee_id == employee.id,
        ).update({Notification.action_url: None}, synchronize_session=False)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Employee email already exists") from None
    db.refresh(employee)
    return _public_values(employee)


def update_employee_status(
    db: Session, organization_id: UUID, employee_id: UUID, status_value: str
) -> dict:
    employee = get_employee(db, organization_id, employee_id)
    employee.status = status_value
    if employee.user is not None:
        employee.user.is_active = status_value == "Active"
    db.commit()
    db.refresh(employee)
    return _public_values(employee)


def employee_summary(db: Session, organization_id: UUID) -> dict[str, int]:
    rows = db.execute(
        select(Employee.status, func.count(Employee.id))
        .where(Employee.organization_id == organization_id)
        .group_by(Employee.status)
    ).all()
    counts = {status_name: count for status_name, count in rows}
    on_leave = db.scalar(
        select(func.count(func.distinct(LeaveRequest.employee_id))).where(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= func.current_date(),
            LeaveRequest.end_date >= func.current_date(),
        )
    ) or 0
    return {
        "total": sum(counts.values()),
        "active": counts.get("Active", 0),
        "inactive": counts.get("Inactive", 0),
        "on_leave": on_leave,
    }
