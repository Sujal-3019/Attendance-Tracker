import argparse
import getpass
import secrets
from uuid import uuid4

from sqlalchemy import func, select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.organization import Organization
from app.models.user import User
from app.services.auth import lock_first_admin_registration


def create_admin(organization_name: str, organization_type: str) -> None:
    email = input("Administrator email: ").strip().lower()
    full_name = input("Administrator full name: ").strip()
    phone = input("Administrator phone: ").strip()
    password = getpass.getpass("Administrator password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if len(full_name) < 2 or "@" not in email or len(phone) < 10:
        raise SystemExit("Enter a valid name, email, and phone.")
    if len(password) < 8 or password != confirmation:
        raise SystemExit("Passwords must match and contain at least 8 characters.")

    enrollment_code = secrets.token_urlsafe(24)
    with SessionLocal() as db:
        lock_first_admin_registration(db)
        if db.scalar(select(func.count()).select_from(Organization)):
            raise SystemExit("An organization already exists. Admin bootstrap is one-time only.")
        organization = Organization(
            id=uuid4(),
            name=organization_name,
            organization_type=organization_type,
            enrollment_code_hash=hash_password(enrollment_code),
        )
        db.add(organization)
        db.flush()
        db.add(
            User(
                organization_id=organization.id,
                email=email,
                full_name=full_name,
                phone=phone,
                password_hash=hash_password(password),
                role="admin",
            )
        )
        db.commit()
    print("Administrator provisioned.")
    print("One-time employee enrollment code (distribute only to verified employees):")
    print(enrollment_code)


def main() -> None:
    parser = argparse.ArgumentParser(prog="attendance-tracker")
    subparsers = parser.add_subparsers(dest="command", required=True)
    admin_parser = subparsers.add_parser("create-admin")
    admin_parser.add_argument("--organization-name", required=True)
    admin_parser.add_argument(
        "--organization-type",
        choices=("office", "factory", "retail", "field", "other"),
        default="office",
    )
    args = parser.parse_args()
    if args.command == "create-admin":
        create_admin(args.organization_name, args.organization_type)


if __name__ == "__main__":
    main()
