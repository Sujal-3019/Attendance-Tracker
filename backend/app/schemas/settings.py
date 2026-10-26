from typing import Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, model_validator

from app.schemas.common import ApiSchema


class OrganizationProfile(ApiSchema):
    organization_name: str = Field(min_length=2, max_length=100)
    organization_email: str
    phone: str = Field(min_length=10, max_length=20)
    address: str = Field(min_length=5, max_length=250)
    timezone: str
    currency: str = Field(min_length=3, max_length=3)
    date_format: str = Field(min_length=1, max_length=30)

    @model_validator(mode="after")
    def validate_timezone(self):
        try:
            ZoneInfo(self.timezone)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("Unknown IANA timezone") from exc
        return self


class AttendancePolicy(ApiSchema):
    work_start_time: str = Field(pattern="^([01]\\d|2[0-3]):([0-5]\\d)$")
    work_end_time: str = Field(pattern="^([01]\\d|2[0-3]):([0-5]\\d)$")
    grace_period_minutes: int = Field(ge=0, le=120)
    late_threshold_minutes: int = Field(ge=1, le=240)
    minimum_working_hours: float = Field(gt=0, le=24)
    half_day_hours: float = Field(gt=0, le=24)
    early_checkout_allowed: bool
    overtime_enabled: bool
    overtime_after_minutes: int = Field(ge=0, le=600)
    working_days: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_policy(self):
        if self.work_end_time <= self.work_start_time:
            raise ValueError("Work end time must be after work start time")
        if self.late_threshold_minutes < self.grace_period_minutes:
            raise ValueError("Late threshold must be at least the grace period")
        if self.half_day_hours > self.minimum_working_hours:
            raise ValueError("Half-day hours cannot exceed minimum working hours")
        if any(day not in {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"} for day in self.working_days):
            raise ValueError("Invalid working day")
        return self


class PayrollPolicy(ApiSchema):
    wage_model: Literal["Monthly", "Daily", "Hourly"] = "Monthly"
    default_wage: float = Field(default=0, ge=0, le=100000000)
    late_deduction_enabled: bool = False
    late_deduction_type: Literal["Per Minute", "Fixed Amount"] = "Per Minute"
    late_deduction_rate: float = Field(default=0, ge=0, le=1000000)
    half_day_deduction_enabled: bool = False
    half_day_deduction_type: Literal["Half Day Wage", "Fixed Amount"] = "Half Day Wage"
    half_day_deduction_amount: float = Field(default=0, ge=0, le=1000000)
    absence_deduction_amount: float = Field(default=0, ge=0, le=1000000)
    absence_deduction_enabled: bool = False
    absence_deduction_type: Literal["Full Day Wage", "Fixed Amount"] = "Full Day Wage"
    overtime_enabled: bool = False
    overtime_multiplier: float = Field(default=1, ge=1, le=5)
    paid_leave_deduction: bool = False
    unpaid_leave_deduction: bool = False


class WorkLocationCreate(ApiSchema):
    name: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=5, max_length=250)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius_meters: int = Field(ge=50, le=5000)
    primary: bool = False


class WorkLocationUpdate(ApiSchema):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    address: str | None = Field(default=None, min_length=5, max_length=250)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    radius_meters: int | None = Field(default=None, ge=50, le=5000)
    primary: bool | None = None


class WorkLocationStatus(ApiSchema):
    status: Literal["Active", "Inactive"]


class WorkLocationPublic(ApiSchema):
    id: UUID
    name: str
    address: str
    latitude: float
    longitude: float
    radius_meters: int
    primary: bool
    status: str
