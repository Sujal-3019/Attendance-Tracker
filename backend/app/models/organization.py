import uuid
from typing import Any

from sqlalchemy import Boolean, ForeignKey, Index, Integer, JSON, Numeric, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class Organization(TimestampMixin, Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    organization_type: Mapped[str] = mapped_column(String(30), nullable=False)
    enrollment_code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="organization")
    employees: Mapped[list["Employee"]] = relationship(back_populates="organization")
    settings: Mapped["OrganizationSettings | None"] = relationship(
        back_populates="organization", cascade="all, delete-orphan", uselist=False
    )


class OrganizationSettings(TimestampMixin, Base):
    __tablename__ = "organization_settings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    organization_profile: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    attendance_policy: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    payroll_policy: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="settings")


class WorkLocation(TimestampMixin, Base):
    __tablename__ = "work_locations"
    __table_args__ = (
        Index(
            "uq_work_location_primary",
            "organization_id",
            unique=True,
            postgresql_where=text("is_primary IS TRUE"),
            sqlite_where=text("is_primary IS TRUE"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    address: Mapped[str] = mapped_column(String(250), nullable=False)
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    radius_meters: Mapped[int] = mapped_column(Integer, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
