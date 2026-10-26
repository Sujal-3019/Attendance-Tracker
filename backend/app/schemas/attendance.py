from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import AliasChoices, Field

from app.schemas.common import ApiSchema


class AttendancePublic(ApiSchema):
    id: UUID
    date: date
    check_in: datetime | None
    check_out: datetime | None
    status: str
    worked_hours: Decimal | None = None


class AttendanceCorrectionCreate(ApiSchema):
    event: Literal["check_in", "check_out"]
    reason: str = Field(min_length=5, max_length=500)


class AttendanceCorrectionDecision(ApiSchema):
    review_reason: str = Field(min_length=2, max_length=500)


class ForgotCheckoutDecision(ApiSchema):
    decision: Literal["MARK_CHECKOUT", "MARK_OVERTIME", "KEEP_PENDING"]
    admin_note: str | None = Field(
        default=None,
        validation_alias=AliasChoices("adminNote", "admin_note"),
        max_length=500,
    )


class AttendanceRecordPage(ApiSchema):
    items: list[dict]
    total: int
    page: int
    page_size: int
