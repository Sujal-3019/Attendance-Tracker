from datetime import time
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.auth_deps import require_roles
from app.api.deps import get_db
from app.schemas.dashboard import AttendanceChart
from app.models.attendance import AttendanceRecord
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.user import User
from app.services.attendance import attendance_context
from app.services import dashboard as dashboard_service


router = APIRouter(prefix="/dashboard", tags=["dashboard"])
AdminUser = Annotated[User, Depends(require_roles("admin"))]


@router.get("/summary")
def get_summary(user: AdminUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    local_now, policy = attendance_context(db, user.organization_id)
    today = local_now.date()
    total_employees = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.organization_id == user.organization_id,
            Employee.status == "Active",
        )
    ) or 0
    records = db.execute(
        select(AttendanceRecord.status, func.count(AttendanceRecord.id))
        .where(
            AttendanceRecord.organization_id == user.organization_id,
            AttendanceRecord.attendance_date == today,
        )
        .group_by(AttendanceRecord.status)
    ).all()
    counts = {name: count for name, count in records}
    on_leave = db.scalar(
        select(func.count(func.distinct(LeaveRequest.employee_id)))
        .join(Employee, Employee.id == LeaveRequest.employee_id)
        .where(
            LeaveRequest.organization_id == user.organization_id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= today,
            LeaveRequest.end_date >= today,
            Employee.status == "Active",
        )
    ) or 0
    attendance_employee_ids = set(
        db.scalars(
            select(AttendanceRecord.employee_id)
            .join(Employee, Employee.id == AttendanceRecord.employee_id)
            .where(
                AttendanceRecord.organization_id == user.organization_id,
                AttendanceRecord.attendance_date == today,
                Employee.status == "Active",
            )
        ).all()
    )
    leave_employee_ids = set(
        db.scalars(
            select(LeaveRequest.employee_id)
            .join(Employee, Employee.id == LeaveRequest.employee_id)
            .where(
                LeaveRequest.organization_id == user.organization_id,
                LeaveRequest.status == "Approved",
                LeaveRequest.start_date <= today,
                LeaveRequest.end_date >= today,
                Employee.status == "Active",
            )
        ).all()
    )
    working_days = set(policy.get("workingDays", []))
    work_end_time = policy.get("workEndTime")
    scheduled_end = time.fromisoformat(work_end_time) if work_end_time else None
    absent_today = None
    if (
        today.strftime("%A") in working_days
        and scheduled_end is not None
        and local_now.time() >= scheduled_end
    ):
        absent_today = max(
            0,
            total_employees - len(attendance_employee_ids | leave_employee_ids),
        )
    return {
        "totalEmployees": total_employees,
        "presentToday": counts.get("Present", 0) + counts.get("Late", 0),
        "lateToday": counts.get("Late", 0),
        "onLeaveToday": on_leave,
        "absentToday": absent_today,
    }


@router.get("/recent-attendance")
def get_recent_attendance(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    rows = db.execute(
        select(AttendanceRecord, Employee)
        .join(Employee, Employee.id == AttendanceRecord.employee_id)
        .where(AttendanceRecord.organization_id == user.organization_id)
        .order_by(AttendanceRecord.attendance_date.desc(), AttendanceRecord.check_in.desc())
        .limit(10)
    ).all()
    return [
        {
            "id": record.id,
            "employee": employee.full_name,
            "initials": "".join(part[0] for part in employee.full_name.split()[:2]).upper(),
            "department": employee.department,
            "checkIn": record.check_in.strftime("%I:%M %p") if record.check_in else "—",
            "checkOut": record.check_out.strftime("%I:%M %p") if record.check_out else "—",
            "hours": f"{record.worked_hours}h" if record.worked_hours is not None else "—",
            "location": "Not captured",
            "status": record.status,
        }
        for record, employee in rows
    ]


@router.get("/attendance-chart", response_model=AttendanceChart)
def get_attendance_chart(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return dashboard_service.attendance_chart(db, user.organization_id)
