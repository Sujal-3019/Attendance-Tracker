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
from app.services.attendance import organization_local_now
from app.services import dashboard as dashboard_service


router = APIRouter(prefix="/dashboard", tags=["dashboard"])
AdminUser = Annotated[User, Depends(require_roles("admin"))]


@router.get("/summary")
def get_summary(user: AdminUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    today = organization_local_now(db, user.organization_id).date()
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
        select(func.count(func.distinct(LeaveRequest.employee_id))).where(
            LeaveRequest.organization_id == user.organization_id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= today,
            LeaveRequest.end_date >= today,
        )
    ) or 0
    return {
        "totalEmployees": total_employees,
        "presentToday": counts.get("Present", 0) + counts.get("Late", 0),
        "lateToday": counts.get("Late", 0),
        "onLeaveToday": on_leave,
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
