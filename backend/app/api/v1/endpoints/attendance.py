from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user, require_roles
from app.api.deps import get_db
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCorrectionCreate,
    AttendanceCorrectionDecision,
    AttendanceRecordPage,
    ForgotCheckoutDecision,
)
from app.services import attendance as attendance_service


router = APIRouter(tags=["attendance"])
AdminUser = Annotated[User, Depends(require_roles("admin"))]
AuthenticatedUser = Annotated[User, Depends(get_current_user)]


@router.get("/me/attendance")
def get_my_attendance(
    user: AuthenticatedUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
) -> dict:
    return attendance_service.get_my_attendance(db, user, page=page, page_size=page_size)


@router.post("/me/attendance/check-in", status_code=201)
def check_in(user: AuthenticatedUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    return attendance_service.check_in(db, user)


@router.post("/me/attendance/check-out")
def check_out(user: AuthenticatedUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    return attendance_service.check_out(db, user)


@router.post("/me/attendance/corrections", status_code=201)
def request_correction(
    payload: AttendanceCorrectionCreate,
    user: AuthenticatedUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return attendance_service.request_correction(db, user, payload)


@router.get("/attendance", response_model=AttendanceRecordPage)
def get_attendance(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    attendance_date: date | None = Query(None, alias="date"),
    search: str | None = Query(None, max_length=100),
    record_status: str | None = Query(None, alias="status", max_length=20),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
) -> dict:
    return attendance_service.list_admin_records(
        db,
        user.organization_id,
        page=page,
        page_size=page_size,
        attendance_date=attendance_date,
        search=search,
        status_filter=record_status,
    )


@router.get("/attendance/summary")
def get_attendance_summary(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    attendance_date: date | None = Query(None, alias="date"),
) -> dict:
    return attendance_service.attendance_summary(db, user.organization_id, attendance_date)


@router.get("/attendance/corrections")
def get_corrections(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    correction_status: str | None = Query(None, alias="status", max_length=20),
) -> list[dict]:
    return attendance_service.list_corrections(db, user.organization_id, status_filter=correction_status)


@router.get("/attendance/corrections/{correction_id}")
def get_correction(
    correction_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return attendance_service.get_correction(db, user.organization_id, correction_id)


@router.get("/attendance/forgot-checkout")
def get_forgot_checkouts(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    return attendance_service.forgotten_checkouts(db, user.organization_id)


@router.get("/attendance/forgot-checkout/{attendance_id}")
def get_forgot_checkout(
    attendance_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    result = next(
        (
            item
            for item in attendance_service.forgotten_checkouts(db, user.organization_id)
            if item["id"] == attendance_id
        ),
        None,
    )
    if result is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Open attendance record not found")
    return result


@router.post("/attendance/forgot-checkout/{attendance_id}/resolve")
def resolve_forgot_checkout(
    attendance_id: UUID,
    payload: ForgotCheckoutDecision,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return attendance_service.resolve_forgotten_checkout(
        db,
        user.organization_id,
        attendance_id,
        user,
        decision=payload.decision,
        admin_note=payload.admin_note,
    )


@router.post("/attendance/corrections/{correction_id}/approve")
def approve_correction(
    correction_id: UUID,
    payload: AttendanceCorrectionDecision,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return attendance_service.decide_correction(
        db, user.organization_id, correction_id, user, approve=True, review_reason=payload.review_reason
    )


@router.post("/attendance/corrections/{correction_id}/reject")
def reject_correction(
    correction_id: UUID,
    payload: AttendanceCorrectionDecision,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return attendance_service.decide_correction(
        db, user.organization_id, correction_id, user, approve=False, review_reason=payload.review_reason
    )
