from datetime import UTC, date, datetime, timedelta
from datetime import time as time_type
from math import asin, cos, radians, sin, sqrt
from zoneinfo import ZoneInfo
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, literal, or_, select, update
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceCorrection, AttendanceRecord
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.organization import OrganizationSettings, WorkLocation
from app.models.payroll import Notification, OvertimeRequest
from app.models.user import User
from app.schemas.attendance import AttendanceCorrectionCreate, CheckInLocation


def attendance_context(
    db: Session, organization_id: UUID, now: datetime | None = None
) -> tuple[datetime, dict]:
    settings = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == organization_id
        )
    )
    profile = settings.organization_profile if settings else {}
    policy = settings.attendance_policy if settings else {}
    timezone = ZoneInfo(profile.get("timezone", "UTC"))
    return (now or datetime.now(UTC)).astimezone(timezone), policy


def organization_local_now(
    db: Session, organization_id: UUID, now: datetime | None = None
) -> datetime:
    return attendance_context(db, organization_id, now)[0]


def attendance_grace_deadline(
    local_now: datetime, policy: dict
) -> datetime | None:
    scheduled_start = policy.get("workStartTime")
    if not scheduled_start:
        return None
    hour, minute = map(int, scheduled_start.split(":"))
    return local_now.replace(
        hour=hour, minute=minute, second=0, microsecond=0
    ) + timedelta(minutes=policy.get("gracePeriodMinutes", 0))


def mark_absences_for_organization(
    db: Session, organization_id: UUID, now: datetime | None = None
) -> int:
    local_now, policy = attendance_context(db, organization_id, now)
    if local_now.strftime("%A") not in policy.get("workingDays", []):
        return 0

    grace_deadline = attendance_grace_deadline(local_now, policy)
    if grace_deadline is None or local_now <= grace_deadline:
        return 0

    attendance_exists = select(AttendanceRecord.id).where(
        AttendanceRecord.employee_id == Employee.id,
        AttendanceRecord.attendance_date == local_now.date(),
    ).exists()
    approved_leave_exists = select(LeaveRequest.id).where(
        LeaveRequest.organization_id == organization_id,
        LeaveRequest.employee_id == Employee.id,
        LeaveRequest.status == "Approved",
        LeaveRequest.start_date <= local_now.date(),
        LeaveRequest.end_date >= local_now.date(),
    ).exists()
    candidates = select(
        literal(organization_id),
        Employee.id,
        literal(local_now.date()),
        literal("Absent"),
        literal(0),
    ).where(
        Employee.organization_id == organization_id,
        Employee.status == "Active",
        Employee.joining_date <= local_now.date(),
        ~attendance_exists,
        ~approved_leave_exists,
    )
    insert_for_dialect = {
        "postgresql": postgresql_insert,
        "sqlite": sqlite_insert,
    }.get(db.get_bind().dialect.name)
    if insert_for_dialect is None:
        raise RuntimeError("Attendance absence marking requires PostgreSQL or SQLite")

    result = db.execute(
        insert_for_dialect(AttendanceRecord)
        .from_select(
            [
                "organization_id",
                "employee_id",
                "attendance_date",
                "status",
                "late_minutes",
            ],
            candidates,
        )
        .on_conflict_do_nothing(
            index_elements=[
                AttendanceRecord.employee_id,
                AttendanceRecord.attendance_date,
            ]
        )
    )
    db.commit()
    return result.rowcount or 0


def mark_absences_for_all_organizations(db: Session) -> int:
    organization_ids = db.scalars(
        select(OrganizationSettings.organization_id)
    ).all()
    return sum(
        mark_absences_for_organization(db, organization_id)
        for organization_id in organization_ids
    )


def _record_values(record: AttendanceRecord) -> dict:
    return {
        "id": record.id,
        "date": record.attendance_date,
        "checkIn": record.check_in,
        "checkOut": record.check_out,
        "status": record.status,
        "workedHours": record.worked_hours,
    }


def _require_employee(user: User) -> UUID:
    if user.employee_id is None:
        raise HTTPException(status_code=403, detail="An employee profile is required")
    return user.employee_id


def _checkin_requires_location(employee: Employee, local_now: datetime) -> bool:
    if employee.work_mode == "Remote":
        return False
    if employee.work_mode == "Hybrid":
        return local_now.strftime("%A") in (employee.hybrid_office_days or [])
    return True


def get_my_attendance(db: Session, user: User, *, page: int = 1, page_size: int = 30) -> dict:
    employee_id = _require_employee(user)
    mark_absences_for_organization(db, user.organization_id)
    local_now, _ = attendance_context(db, user.organization_id)
    employee = db.scalar(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.organization_id == user.organization_id,
        )
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    today = local_now.date()
    rows = db.scalars(
        select(AttendanceRecord)
        .where(
            AttendanceRecord.organization_id == user.organization_id,
            AttendanceRecord.employee_id == employee_id,
        )
        .order_by(AttendanceRecord.attendance_date.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    ).all()
    today_record = next((record for record in rows if record.attendance_date == today), None)
    pending_correction = None
    if today_record is not None:
        pending_correction = db.scalar(
            select(AttendanceCorrection)
            .where(
                AttendanceCorrection.attendance_id == today_record.id,
                AttendanceCorrection.status == "Pending",
            )
            .order_by(AttendanceCorrection.created_at.desc())
        )
    return {
        "today": _record_values(today_record) if today_record else None,
        "history": [_record_values(record) for record in rows],
        "pendingCorrection": (
            _correction_values(pending_correction, today_record)
            if pending_correction and today_record
            else None
        ),
        "checkInRequiresLocation": _checkin_requires_location(employee, local_now),
    }


def _validate_checkin_location(
    db: Session, organization_id: UUID, payload: CheckInLocation
) -> None:
    if payload.latitude is None or payload.longitude is None or payload.accuracy is None:
        raise HTTPException(
            status_code=422,
            detail="Precise location is required for an office-day check-in.",
        )
    locations = db.scalars(
        select(WorkLocation).where(
            WorkLocation.organization_id == organization_id,
            WorkLocation.is_active.is_(True),
        )
    ).all()
    if not locations:
        raise HTTPException(
            status_code=409,
            detail="Your organization has no active office locations configured.",
        )

    for location in locations:
        latitude_delta = radians(float(location.latitude) - payload.latitude)
        longitude_delta = radians(float(location.longitude) - payload.longitude)
        latitude = radians(payload.latitude)
        location_latitude = radians(float(location.latitude))
        haversine = (
            sin(latitude_delta / 2) ** 2
            + cos(latitude)
            * cos(location_latitude)
            * sin(longitude_delta / 2) ** 2
        )
        distance = 6_371_000 * 2 * asin(sqrt(min(1, haversine)))
        if distance + payload.accuracy <= location.radius_meters:
            return

    raise HTTPException(
        status_code=403,
        detail="Check-in is only available from within an active office's geofence. Enable precise location and try again.",
    )


def check_in(db: Session, user: User, payload: CheckInLocation) -> dict:
    employee_id = _require_employee(user)
    now = datetime.now(UTC)
    local_now, policy = attendance_context(db, user.organization_id, now)
    employee = db.scalar(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.organization_id == user.organization_id,
        )
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    today = local_now.date()
    late_minutes = 0
    attendance_status = "Present"
    scheduled_start = policy.get("workStartTime")
    if scheduled_start:
        hour, minute = map(int, scheduled_start.split(":"))
        start = local_now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        late_minutes = max(0, int((local_now - start).total_seconds() // 60))
        grace_deadline = attendance_grace_deadline(local_now, policy)
        if grace_deadline is not None and local_now > grace_deadline:
            attendance_status = "Late"
    record = db.scalar(
        select(AttendanceRecord)
        .where(
            AttendanceRecord.organization_id == user.organization_id,
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.attendance_date == today,
        )
        .with_for_update()
    )
    if record is not None and (record.check_in is not None or record.check_out is not None):
        raise HTTPException(status_code=409, detail="You have already checked in today")
    if _checkin_requires_location(employee, local_now):
        _validate_checkin_location(db, user.organization_id, payload)
    if record is not None:
        if record.status == "Absent" and record.check_in is None:
            record.check_in = now
            record.status = attendance_status
            record.late_minutes = late_minutes
            db.commit()
            db.refresh(record)
            return _record_values(record)
        record.check_in = now
        record.status = attendance_status
        record.late_minutes = late_minutes
        db.commit()
        db.refresh(record)
        return _record_values(record)
    record = AttendanceRecord(
        organization_id=user.organization_id,
        employee_id=employee_id,
        attendance_date=today,
        check_in=now,
        status=attendance_status,
        late_minutes=late_minutes,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already checked in today") from None
    db.refresh(record)
    return _record_values(record)


def check_out(db: Session, user: User) -> dict:
    employee_id = _require_employee(user)
    today, _ = attendance_context(db, user.organization_id)
    today = today.date()
    record = db.scalar(
        select(AttendanceRecord)
        .where(
            AttendanceRecord.organization_id == user.organization_id,
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.attendance_date == today,
        )
        .with_for_update()
    )
    if record is None or record.check_in is None:
        raise HTTPException(status_code=409, detail="You must check in before checking out")
    if record.check_out is not None:
        raise HTTPException(status_code=409, detail="You have already checked out today")
    record.check_out = datetime.now(UTC)
    checked_in_at = record.check_in
    if checked_in_at.tzinfo is None:
        checked_in_at = checked_in_at.replace(tzinfo=UTC)
    worked_seconds = (record.check_out - checked_in_at).total_seconds()
    record.worked_hours = round(max(0, worked_seconds) / 3600, 2)
    db.commit()
    db.refresh(record)
    return _record_values(record)


def request_correction(
    db: Session, user: User, payload: AttendanceCorrectionCreate
) -> dict:
    employee_id = _require_employee(user)
    today, _ = attendance_context(db, user.organization_id)
    today = today.date()
    record = db.scalar(
        select(AttendanceRecord)
        .where(
            AttendanceRecord.organization_id == user.organization_id,
            AttendanceRecord.employee_id == employee_id,
            AttendanceRecord.attendance_date == today,
        )
        .with_for_update()
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Today's attendance record was not found")
    pending_correction = db.scalar(
        select(AttendanceCorrection.id).where(
            AttendanceCorrection.attendance_id == record.id,
            AttendanceCorrection.status == "Pending",
        )
    )
    if pending_correction is not None:
        raise HTTPException(
            status_code=409,
            detail="An attendance correction is already awaiting review",
        )
    if payload.event == "check_in":
        if record.check_in is None or record.check_out is not None:
            raise HTTPException(status_code=409, detail="Check-in cannot be reset in the current state")
        requested_in, requested_out = None, None
    else:
        if record.check_out is None:
            raise HTTPException(status_code=409, detail="There is no check-out to correct")
        requested_in, requested_out = record.check_in, None
    correction = AttendanceCorrection(
        organization_id=user.organization_id,
        attendance_id=record.id,
        requester_user_id=user.id,
        original_check_in=record.check_in,
        original_check_out=record.check_out,
        requested_check_in=requested_in,
        requested_check_out=requested_out,
        reason=payload.reason.strip(),
    )
    db.add(correction)
    db.flush()
    employee = db.get(Employee, employee_id)
    admins = db.scalars(
        select(User).where(
            User.organization_id == user.organization_id,
            User.role == "admin",
            User.is_active.is_(True),
        )
    ).all()
    event_label = "check-in" if payload.event == "check_in" else "check-out"
    for admin in admins:
        db.add(
            Notification(
                organization_id=user.organization_id,
                user_id=admin.id,
                title="Attendance correction request",
                message=(
                    f"{employee.full_name} requested a {event_label} correction "
                    f"for {record.attendance_date.isoformat()}."
                ),
                category="ATTENDANCE_CORRECTION",
                action_url=f"/attendance?correction={correction.id}",
                related_employee_id=employee_id,
            )
        )
    db.commit()
    db.refresh(correction)
    return _correction_values(correction, record)


def _correction_values(correction: AttendanceCorrection, record: AttendanceRecord) -> dict:
    return {
        "id": correction.id,
        "attendanceId": correction.attendance_id,
        "employeeId": record.employee_id,
        "attendanceDate": record.attendance_date,
        "originalCheckIn": correction.original_check_in,
        "originalCheckOut": correction.original_check_out,
        "requestedCheckIn": correction.requested_check_in,
        "requestedCheckOut": correction.requested_check_out,
        "reason": correction.reason,
        "status": correction.status,
        "reviewReason": correction.review_reason,
        "reviewedAt": correction.reviewed_at,
    }


def list_admin_records(
    db: Session,
    organization_id: UUID,
    *,
    page: int,
    page_size: int,
    attendance_date: date | None,
    employee_id: UUID | None,
    search: str | None,
    status_filter: str | None,
) -> dict:
    mark_absences_for_organization(db, organization_id)
    statement = (
        select(AttendanceRecord, Employee)
        .join(Employee, Employee.id == AttendanceRecord.employee_id)
        .where(AttendanceRecord.organization_id == organization_id)
    )
    if attendance_date:
        statement = statement.where(AttendanceRecord.attendance_date == attendance_date)
    if employee_id:
        statement = statement.where(AttendanceRecord.employee_id == employee_id)
    if status_filter:
        statement = statement.where(AttendanceRecord.status == status_filter)
    if search:
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(Employee.full_name.ilike(term), Employee.employee_code.ilike(term))
        )
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.execute(
        statement.order_by(AttendanceRecord.attendance_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    items = [
        {
            **_record_values(record),
            "employeeId": employee.id,
            "employeeName": employee.full_name,
            "employeeCode": employee.employee_code,
            "department": employee.department,
            "location": None,
        }
        for record, employee in rows
    ]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


def attendance_summary(
    db: Session, organization_id: UUID, attendance_date: date | None
) -> dict:
    local_now, policy = attendance_context(db, organization_id)
    attendance_date = attendance_date or local_now.date()
    if attendance_date == local_now.date():
        mark_absences_for_organization(db, organization_id, local_now)
    rows = db.execute(
        select(AttendanceRecord.status, func.count(AttendanceRecord.id))
        .where(
            AttendanceRecord.organization_id == organization_id,
            AttendanceRecord.attendance_date == attendance_date,
        )
        .group_by(AttendanceRecord.status)
    ).all()
    counts = {name: count for name, count in rows}
    total_employees = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.organization_id == organization_id,
            Employee.status == "Active",
        )
    ) or 0
    active_employees = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.organization_id == organization_id,
            Employee.status == "Active",
            Employee.joining_date <= attendance_date,
        )
    ) or 0
    on_leave = db.scalar(
        select(func.count(func.distinct(LeaveRequest.employee_id))).where(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= attendance_date,
            LeaveRequest.end_date >= attendance_date,
        )
    ) or 0
    is_working_day = attendance_date.strftime("%A") in policy.get("workingDays", [])
    return {
        "date": attendance_date,
        "present": counts.get("Present", 0),
        "late": counts.get("Late", 0),
        "onLeave": on_leave,
        "absent": counts.get("Absent", 0),
        "unmarked": (
            max(
                0,
                active_employees
                - counts.get("Present", 0)
                - counts.get("Late", 0)
                - counts.get("Absent", 0)
                - on_leave,
            )
            if is_working_day
            else None
        ),
        "total": sum(counts.values()),
        "totalEmployees": total_employees,
    }


def list_corrections(
    db: Session, organization_id: UUID, *, status_filter: str | None = None
) -> list[dict]:
    statement = (
        select(AttendanceCorrection, AttendanceRecord, Employee)
        .join(AttendanceRecord, AttendanceRecord.id == AttendanceCorrection.attendance_id)
        .join(Employee, Employee.id == AttendanceRecord.employee_id)
        .where(
            AttendanceCorrection.organization_id == organization_id,
            AttendanceCorrection.archived_at.is_(None),
        )
    )
    if status_filter:
        statement = statement.where(AttendanceCorrection.status == status_filter)
    rows = db.execute(statement.order_by(AttendanceCorrection.created_at.desc())).all()
    results = []
    for correction, record, employee in rows:
        item = _correction_values(correction, record)
        item.update(employeeName=employee.full_name, employeeCode=employee.employee_code, department=employee.department)
        results.append(item)
    return results


def archive_resolved_corrections(
    db: Session, organization_id: UUID, admin_user_id: UUID
) -> int:
    result = db.execute(
        update(AttendanceCorrection)
        .where(
            AttendanceCorrection.organization_id == organization_id,
            AttendanceCorrection.status.in_(("Approved", "Rejected")),
            AttendanceCorrection.archived_at.is_(None),
        )
        .values(
            archived_at=datetime.now(UTC),
            archived_by_user_id=admin_user_id,
        )
    )
    db.commit()
    return result.rowcount or 0


def get_correction(db: Session, organization_id: UUID, correction_id: UUID) -> dict:
    row = db.execute(
        select(AttendanceCorrection, AttendanceRecord, Employee)
        .join(AttendanceRecord, AttendanceRecord.id == AttendanceCorrection.attendance_id)
        .join(Employee, Employee.id == AttendanceRecord.employee_id)
        .where(
            AttendanceCorrection.id == correction_id,
            AttendanceCorrection.organization_id == organization_id,
        )
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Attendance correction not found")
    correction, record, employee = row
    values = _correction_values(correction, record)
    values.update(
        employeeName=employee.full_name,
        employeeCode=employee.employee_code,
        department=employee.department,
    )
    return values


def forgotten_checkouts(db: Session, organization_id: UUID) -> list[dict]:
    rows = db.execute(
        select(AttendanceRecord, Employee)
        .join(Employee, Employee.id == AttendanceRecord.employee_id)
        .where(
            AttendanceRecord.organization_id == organization_id,
            AttendanceRecord.check_in.is_not(None),
            AttendanceRecord.check_out.is_(None),
        )
        .order_by(AttendanceRecord.attendance_date.desc())
        .limit(100)
    ).all()
    settings = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == organization_id
        )
    )
    policy = settings.attendance_policy if settings else {}
    profile = settings.organization_profile if settings else {}
    results = []
    for record, employee in rows:
        overtime = db.scalar(
            select(OvertimeRequest).where(
                OvertimeRequest.organization_id == organization_id,
                OvertimeRequest.employee_id == employee.id,
                OvertimeRequest.attendance_date == record.attendance_date,
            )
        )
        results.append(
            {
                "id": record.id,
                "employeeId": employee.id,
                "employeeName": employee.full_name,
                "employeeCode": employee.employee_code,
                "department": employee.department,
                "attendanceDate": record.attendance_date,
                "checkIn": record.check_in,
                "scheduledEndTime": policy.get("workEndTime"),
                "checkOut": None,
                "currentStatus": "Overtime Pending" if overtime else "Checked In",
                "locationStatus": "Not captured",
                "locationName": None,
                "overtimeEnabled": bool(policy.get("overtimeEnabled", False)),
                "overtimeAfterMinutes": policy.get("overtimeAfterMinutes"),
                "overtimeDecision": "MARK_OVERTIME" if overtime else None,
                "overtimeStatus": overtime.status if overtime else "Not Applicable",
                "overtimeHours": overtime.hours if overtime else 0,
                "notificationSentAt": None,
                "adminNote": overtime.review_note if overtime else None,
                "resolvedAt": overtime.reviewed_at if overtime else None,
                "resolvedBy": None,
                "timezone": profile.get("timezone", "UTC"),
            }
        )
    return results


def resolve_forgotten_checkout(
    db: Session,
    organization_id: UUID,
    attendance_id: UUID,
    reviewer: User,
    *,
    decision: str,
    admin_note: str | None,
) -> dict:
    if decision not in {"MARK_CHECKOUT", "MARK_OVERTIME", "KEEP_PENDING"}:
        raise HTTPException(status_code=422, detail="Invalid checkout resolution")
    if decision != "KEEP_PENDING" and not admin_note or (
        decision != "KEEP_PENDING" and admin_note and len(admin_note.strip()) < 2
    ):
        raise HTTPException(status_code=422, detail="An admin note is required")
    record = db.scalar(
        select(AttendanceRecord)
        .where(
            AttendanceRecord.id == attendance_id,
            AttendanceRecord.organization_id == organization_id,
        )
        .with_for_update()
    )
    if record is None or record.check_in is None:
        raise HTTPException(status_code=404, detail="Open attendance record not found")
    if record.check_out is not None:
        raise HTTPException(status_code=409, detail="Attendance has already been checked out")
    employee = db.get(Employee, record.employee_id)
    settings = db.scalar(
        select(OrganizationSettings).where(
            OrganizationSettings.organization_id == organization_id
        )
    )
    if decision == "MARK_CHECKOUT":
        policy = settings.attendance_policy if settings else {}
        profile = settings.organization_profile if settings else {}
        scheduled = policy.get("workEndTime")
        if not scheduled:
            raise HTTPException(status_code=409, detail="Configure office hours before marking checkout")
        timezone = ZoneInfo(profile.get("timezone", "UTC"))
        hour, minute = map(int, scheduled.split(":"))
        requested_checkout = datetime.combine(
            record.attendance_date, time_type(hour, minute), tzinfo=timezone
        ).astimezone(UTC)
        checked_in_at = record.check_in
        if checked_in_at.tzinfo is None:
            checked_in_at = checked_in_at.replace(tzinfo=UTC)
        if requested_checkout < checked_in_at:
            raise HTTPException(status_code=422, detail="Scheduled checkout is before the recorded check-in")
        record.check_out = requested_checkout
        record.worked_hours = round(
            max(0, (requested_checkout - checked_in_at).total_seconds()) / 3600, 2
        )
        correction = AttendanceCorrection(
            organization_id=organization_id,
            attendance_id=record.id,
            requester_user_id=reviewer.id,
            reviewer_user_id=reviewer.id,
            original_check_in=record.check_in,
            original_check_out=None,
            requested_check_in=checked_in_at,
            requested_check_out=requested_checkout,
            reason=f"Forgotten checkout resolution: {admin_note.strip()}",
            review_reason=admin_note.strip(),
            status="Approved",
            reviewed_at=datetime.now(UTC),
        )
        db.add(correction)
    elif decision == "MARK_OVERTIME":
        existing = db.scalar(
            select(OvertimeRequest).where(
                OvertimeRequest.organization_id == organization_id,
                OvertimeRequest.employee_id == record.employee_id,
                OvertimeRequest.attendance_date == record.attendance_date,
            )
        )
        if existing:
            raise HTTPException(status_code=409, detail="Overtime review is already pending or complete")
        db.add(
            OvertimeRequest(
                organization_id=organization_id,
                employee_id=record.employee_id,
                attendance_date=record.attendance_date,
                reason=admin_note.strip(),
            )
        )
    db.commit()
    return next(
        item
        for item in forgotten_checkouts(db, organization_id)
        if item["id"] == attendance_id
    ) if decision != "MARK_CHECKOUT" else {
        "id": record.id,
        "employeeId": employee.id,
        "employeeName": employee.full_name,
        "attendanceDate": record.attendance_date,
        "checkIn": record.check_in,
        "checkOut": record.check_out,
        "currentStatus": "Checked Out",
        "adminNote": admin_note.strip(),
        "resolvedAt": datetime.now(UTC),
        "resolvedBy": reviewer.full_name,
    }


def decide_correction(
    db: Session,
    organization_id: UUID,
    correction_id: UUID,
    reviewer: User,
    *,
    approve: bool,
    review_reason: str,
) -> dict:
    correction = db.scalar(
        select(AttendanceCorrection)
        .where(
            AttendanceCorrection.id == correction_id,
            AttendanceCorrection.organization_id == organization_id,
        )
        .with_for_update()
    )
    if correction is None:
        raise HTTPException(status_code=404, detail="Attendance correction not found")
    if correction.status != "Pending":
        raise HTTPException(status_code=409, detail="Only pending corrections can be reviewed")
    record = db.scalar(
        select(AttendanceRecord)
        .where(AttendanceRecord.id == correction.attendance_id)
        .with_for_update()
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    if approve:
        requested_in = correction.requested_check_in
        requested_out = correction.requested_check_out
        if requested_in and requested_in.tzinfo is None:
            requested_in = requested_in.replace(tzinfo=UTC)
        if requested_out and requested_out.tzinfo is None:
            requested_out = requested_out.replace(tzinfo=UTC)
        if requested_out and requested_in and requested_out < requested_in:
            raise HTTPException(status_code=422, detail="Check-out must be after check-in")
        record.check_in = requested_in
        record.check_out = requested_out
        if record.check_in is None:
            record.status = "Correction"
        elif record.check_out is None:
            record.status = "Present"
            record.worked_hours = None
        else:
            record.status = "Present"
            record.worked_hours = round(
                max(0, (record.check_out - record.check_in).total_seconds()) / 3600, 2
            )
        correction.status = "Approved"
    else:
        correction.status = "Rejected"
    correction.review_reason = review_reason.strip()
    correction.reviewer_user_id = reviewer.id
    correction.reviewed_at = datetime.now(UTC)
    db.commit()
    db.refresh(correction)
    return _correction_values(correction, record)
