import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, JSON, Numeric, String, Uuid, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class Employee(TimestampMixin, Base):
    __tablename__ = "employees"
    __table_args__ = (
        UniqueConstraint("organization_id", "employee_code", name="uq_employee_org_code"),
        UniqueConstraint("organization_id", "email", name="uq_employee_org_email"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    employee_code: Mapped[str] = mapped_column(String(30), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    manager: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    employment_type: Mapped[str] = mapped_column(String(30), nullable=False)
    work_mode: Mapped[str] = mapped_column(String(30), nullable=False)
    work_location: Mapped[str | None] = mapped_column(String(100))
    hybrid_office_days: Mapped[list[str]] = mapped_column(
        JSON, default=list, server_default=text("'[]'"), nullable=False
    )
    joining_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)
    profile_complete: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    wage_model: Mapped[str] = mapped_column(String(20), default="Monthly", nullable=False)
    base_wage: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"), nullable=False)
    basic_salary: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    dearness_allowance: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    house_rent_allowance: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    other_allowances: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    tax_regime: Mapped[str] = mapped_column(String(10), default="new", nullable=False)

    organization: Mapped["Organization"] = relationship(back_populates="employees")
    user: Mapped["User | None"] = relationship(
        back_populates="employee", foreign_keys="User.employee_id", uselist=False
    )
