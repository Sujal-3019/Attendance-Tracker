from collections.abc import Generator
from datetime import date
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.security import hash_password
from app.db.base import Base
from app.main import app
from app.models.employee import Employee
from app.models.leave import LeaveType
from app.models.organization import Organization, OrganizationSettings, WorkLocation
from app.models.user import User


@pytest.fixture
def client() -> Generator[tuple[TestClient, dict[str, str]], None, None]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _record):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    organization_id, employee_id = uuid4(), uuid4()
    admin_id, employee_user_id = uuid4(), uuid4()
    password_hash = hash_password("secure-test-password")
    enrollment_hash = hash_password("test-enrollment-code")

    with session_factory() as db:
        organization = Organization(
            id=organization_id,
            name="Test Org",
            organization_type="office",
            enrollment_code_hash=enrollment_hash,
        )
        employee = Employee(
            id=employee_id,
            organization_id=organization_id,
            employee_code="EMP-TEST",
            full_name="Test Employee",
            email="employee@example.com",
            phone="9876543210",
            department="Engineering",
            designation="Engineer",
            manager="Test Admin",
            employment_type="Full-time",
            work_mode="Office",
            work_location="Main Office",
            joining_date=date.today(),
            status="Active",
            wage_model="Monthly",
            base_wage=50000,
        )
        db.add_all([organization, employee])
        db.add(
            WorkLocation(
                organization_id=organization_id,
                name="Main Office",
                address="Bengaluru",
                latitude=12.9716,
                longitude=77.5946,
                radius_meters=150,
                is_primary=True,
                is_active=True,
            )
        )
        db.add(
            OrganizationSettings(
                organization_id=organization_id,
                organization_profile={"timezone": "UTC"},
                attendance_policy={
                    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "minimumWorkingHours": 8,
                },
                payroll_policy={},
            )
        )
        db.flush()
        db.add_all(
            [
                User(
                    id=admin_id,
                    organization_id=organization_id,
                    email="admin@example.com",
                    password_hash=password_hash,
                    full_name="Test Admin",
                    phone="9876543211",
                    role="admin",
                ),
                User(
                    id=employee_user_id,
                    organization_id=organization_id,
                    employee_id=employee_id,
                    email=employee.email,
                    password_hash=password_hash,
                    full_name=employee.full_name,
                    phone=employee.phone,
                    role="employee",
                ),
                LeaveType(
                    organization_id=organization_id,
                    name="Annual Leave",
                    code="AL",
                    description="Test leave type",
                    annual_allocation=10,
                    paid=True,
                    carry_forward=False,
                    max_consecutive_days=10,
                    is_active=True,
                ),
            ]
        )
        db.commit()

    def override_get_db() -> Generator[Session, None, None]:
        with session_factory() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    data = {
        "organization_id": str(organization_id),
        "employee_id": str(employee_id),
        "admin_email": "admin@example.com",
        "employee_email": "employee@example.com",
        "password": "secure-test-password",
    }
    try:
        yield test_client, data
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture
def empty_client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db() -> Generator[Session, None, None]:
        with session_factory() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()
