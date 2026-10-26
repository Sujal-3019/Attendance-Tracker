from datetime import date

from app.schemas.common import ApiSchema


class AttendanceChartPoint(ApiSchema):
    date: date
    day: str
    present: int
    late: int
    leave: int
    absent: int | None


class AttendanceChart(ApiSchema):
    week_start: date
    week_end: date
    items: list[AttendanceChartPoint]
