from datetime import date, time, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceRecord
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.services.attendance import attendance_context


def attendance_chart(db: Session, organization_id: UUID) -> dict:
    local_now, policy = attendance_context(db, organization_id)
    today = local_now.date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    active_employees = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.organization_id == organization_id,
            Employee.status == "Active",
        )
    ) or 0
    attendance_rows = db.execute(
        select(
            AttendanceRecord.attendance_date,
            AttendanceRecord.employee_id,
            AttendanceRecord.status,
        )
        .join(Employee, Employee.id == AttendanceRecord.employee_id)
        .where(
            AttendanceRecord.organization_id == organization_id,
            AttendanceRecord.attendance_date >= week_start,
            AttendanceRecord.attendance_date <= week_end,
            Employee.status == "Active",
        )
    ).all()
    leave_rows = db.execute(
        select(LeaveRequest.employee_id, LeaveRequest.start_date, LeaveRequest.end_date)
        .join(Employee, Employee.id == LeaveRequest.employee_id)
        .where(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= week_end,
            LeaveRequest.end_date >= week_start,
            Employee.status == "Active",
        )
    ).all()

    attendance_by_date: dict[date, list[tuple[UUID, str]]] = {}
    for attendance_date, employee_id, status in attendance_rows:
        attendance_by_date.setdefault(attendance_date, []).append((employee_id, status))

    leave_by_date: dict[date, set[UUID]] = {}
    for employee_id, start_date, end_date in leave_rows:
        current = max(start_date, week_start)
        final = min(end_date, week_end)
        while current <= final:
            leave_by_date.setdefault(current, set()).add(employee_id)
            current += timedelta(days=1)

    working_days = set(policy.get("workingDays", []))
    work_end_time = policy.get("workEndTime")
    scheduled_end = time.fromisoformat(work_end_time) if work_end_time else None
    items = []
    for offset in range(7):
        attendance_date = week_start + timedelta(days=offset)
        records = attendance_by_date.get(attendance_date, [])
        employees_with_records = {employee_id for employee_id, _ in records}
        employees_on_leave = leave_by_date.get(attendance_date, set())
        day_is_working = attendance_date.strftime("%A") in working_days
        workday_complete = attendance_date < today or (
            attendance_date == today
            and scheduled_end is not None
            and local_now.time() >= scheduled_end
        )
        absent = None
        if day_is_working and workday_complete:
            absent = max(
                0,
                active_employees - len(employees_with_records | employees_on_leave),
            )
        items.append(
            {
                "date": attendance_date,
                "day": attendance_date.strftime("%a"),
                "present": sum(status == "Present" for _, status in records),
                "late": sum(status == "Late" for _, status in records),
                "leave": len(employees_on_leave),
                "absent": absent,
            }
        )

    return {"weekStart": week_start, "weekEnd": week_end, "items": items}
