import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class AttendanceRecord(TimestampMixin, Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("employee_id", "attendance_date", name="uq_attendance_employee_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("employees.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    attendance_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="Present", nullable=False)
    late_minutes: Mapped[int] = mapped_column(default=0, nullable=False)
    worked_hours: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))


class AttendanceCorrection(TimestampMixin, Base):
    __tablename__ = "attendance_corrections"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    attendance_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("attendance_records.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    requester_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    original_check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    original_check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reviewer_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT")
    )
    requested_check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    requested_check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    review_reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="Pending", nullable=False, index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
