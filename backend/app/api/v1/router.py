from fastapi import APIRouter

from app.api.v1.endpoints import (
    attendance,
    auth,
    dashboard,
    employees,
    health,
    leaves,
    notifications,
    payroll,
    profile,
    settings,
)


api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(employees.router)
api_router.include_router(attendance.router)
api_router.include_router(leaves.router)
api_router.include_router(settings.router)
api_router.include_router(payroll.router)
api_router.include_router(profile.router)
api_router.include_router(dashboard.router)
api_router.include_router(notifications.router)
