# Attendance Tracker Backend

FastAPI backend for the existing React attendance application. The API uses synchronous SQLAlchemy 2.x with Psycopg 3, PostgreSQL, Pydantic v2, and Alembic. The frontend audit and endpoint mapping are in [docs/FRONTEND_AUDIT.md](./docs/FRONTEND_AUDIT.md) and [docs/API_CONTRACT.md](./docs/API_CONTRACT.md).

## Prerequisites

- Python 3.12 or newer
- PostgreSQL and an existing database; this project does not create or rename it
- Node.js/npm for running the frontend

## Windows PowerShell setup

Run these commands from the repository root:

```powershell
Set-Location .\backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks activation, use `.\.venv\Scripts\python.exe` directly or adjust the execution policy for the current user according to your organization's policy.

Create `.env` only if it does not already exist:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit `.env` locally with the already-created PostgreSQL connection string and a randomly generated `JWT_SECRET_KEY` containing at least 32 characters. Do not commit or share `.env`. The application reads `DATABASE_URL`; SQLAlchemy safely parses the URL and selects the Psycopg 3 driver. Other supported settings are `ADMIN_SETUP_CODE` (optional, 32-128 private characters), `CORS_ORIGINS` (comma-separated exact origins), `ENVIRONMENT`, and `ACCESS_TOKEN_EXPIRE_MINUTES` (1-60).

Generate a JWT signing secret locally with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

The application rejects missing/weak secrets and non-PostgreSQL URLs at startup. Database errors returned by the health endpoint do not include connection details.

## Database connection and migrations

The PostgreSQL URL is configured through `.env`; never paste it into logs or issue reports. Verify connectivity without changing schema by starting the API and requesting `http://localhost:8000/health/db`, or run:

```powershell
python -c "from sqlalchemy import create_engine, text; from app.core.config import get_settings; e=create_engine(get_settings().sqlalchemy_database_url, connect_args={'connect_timeout': 5}); c=e.connect(); c.execute(text('SELECT 1')); print('PostgreSQL connection: ok'); c.close(); e.dispose()"
```

Before applying the initial migration, inspect the target schema and current Alembic revision. The migration is additive and creates the application tables; it does not drop, truncate, or recreate existing objects:

```powershell
alembic current
alembic upgrade head
alembic current
alembic check
```

Run migrations from `backend\`. Do not use `downgrade base`, `drop_all`, or database reset commands against a development or production database. If `alembic current` shows an unknown revision or the target database already contains application tables, stop and inspect/reconcile the schema before upgrading.

To create a future migration after changing models:

```powershell
alembic revision --autogenerate -m "describe schema change"
```

Review the generated script, especially data transformations and constraints, before applying it. `Base.metadata.create_all()` is used only by the isolated SQLite test fixture, never as the production migration mechanism.

## Start the API

From `backend\` with the virtual environment active:

```powershell
python -m uvicorn app.main:app --reload
```

- Health: `http://localhost:8000/health`
- Database health: `http://localhost:8000/health/db`
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

The versioned application routes are under `/api/v1`. Configure CORS with explicit origins; the development default is `http://localhost:5173`. Do not use wildcard origins in production.

## Frontend integration

Run the frontend separately from `frontend\`:

```powershell
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend\.env.local` to the API origin, for example `http://localhost:8000`; the shared request helper defaults to that value. Set the backend `CORS_ORIGINS` to the exact frontend origin. Bearer access tokens are held in frontend memory and expire after 15 minutes. Reloading the page clears the token and requires another login; tokens are not persisted in local storage.

## Initial administrator provisioning

The first administrator can be registered through the web app. To protect the first-account race, set a private one-time code in `backend\.env` before starting/restarting the API:

```env
ADMIN_SETUP_CODE=paste-a-private-random-code-of-at-least-32-characters
```

Generate a value locally, for example:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Enter the same code in the Administrator registration form. The backend compares it without logging or returning it. The form becomes unavailable after the first organization is created; concurrent registration attempts are serialized by a PostgreSQL advisory lock. The successful response displays an initial company enrollment code—save it and share only with verified employees. Admins can generate a replacement at **Company Code** in the portal; generating a replacement immediately invalidates the previous code. Remove `ADMIN_SETUP_CODE` from `.env` and restart the API after the first successful setup. This route cannot register additional organizations or promote users afterward.

Alternatively, after migrations, provision the first organization administrator from a trusted local shell:

```powershell
python -m app.cli create-admin --organization-name "Your Organization" --organization-type office
```

The command prompts for administrator identity and password without echoing the password. It prints an initial company enrollment code after creation; distribute it only to verified employees through a secure channel. CLI bootstrap also closes web registration because an organization now exists. Admins can rotate the code from the portal, but codes do not expire automatically and are reusable until rotated.

## Tests

From `backend\`:

```powershell
python -m pytest tests -q
```

Tests use a per-test in-memory SQLite database with foreign keys enabled and do not connect to or truncate the configured PostgreSQL database.

## Extending the application

1. Add or update a SQLAlchemy model under `app/models/` and register it in `app/models/__init__.py`.
2. Add explicit request/response schemas under `app/schemas/`.
3. Implement transactional/business rules in a focused `app/services/` module.
4. Add thin routes in `app/api/v1/endpoints/` and include the router in `app/api/v1/router.py`.
5. Add authorization and ownership checks; never trust submitted employee or organization IDs.
6. Add isolated tests and create/review an Alembic migration.
7. Update [docs/API_CONTRACT.md](./docs/API_CONTRACT.md) and the audit's status checklist.

## Current limitations and decisions requiring confirmation

- Payroll finalization and salary projection are intentionally unavailable until wage, deduction, rounding, overtime eligibility, legal/tax, payroll-period, and historical-snapshot rules are approved. Payroll finalization responds with `409 Conflict`; no financial formula is inferred from UI mock data.
- Leave balances start from leave-type annual allocations; leave-year boundaries, carry-forward expiry, holiday calendars, and pending-request reservations remain policy decisions.
- Attendance uses one organization timezone, configured work start/grace period, and working days. The dashboard classifies missing attendance as absent only after a configured working day is complete; incomplete, nonworking, or future days are unknown. The UI does not define how `lateThresholdMinutes` differs from grace, so check-in status uses grace only. Overnight shifts, per-employee shifts, holidays, early-departure deductions, and employee location capture are not implemented. Browser GPS is untrusted and does not provide anti-spoofing assurance.
- Attendance reset actions create reviewable correction requests rather than deleting history. Admin review and state transitions are recorded.
- Salary advances and repayments preserve transaction history and use decimal amounts; repayment cannot exceed the outstanding balance and requires an idempotency key.
- Employee self-registration requires a current company code, employee-provided name, email, phone number, and password. It creates a pending employment profile and sends an actionable notification to active organization admins. Admins complete employee code, job details, salary, and leave allocation from the employee edit page; they cannot change the employee-provided name. Employee accounts can sign in before that profile is complete.
- The company code is stored as a password hash, shown only when generated, reusable until rotated, and rotation invalidates the previous code. There is no per-employee invite or automatic expiry. Email/phone ownership verification is not implemented; admins should verify new registrations before completing the profile.
- Employees may log in with their registered email or phone and password. If a phone number matches multiple accounts, use email instead.
- Admin-created employees receive a linked login account using the email and initial password entered in the employee form. The password is Argon2-hashed, excluded from responses, and should be shared with the employee through a secure channel. Employees can sign in immediately when created as active; inactive employee accounts remain blocked until activated. Password changes are not yet available in the UI.
- Access tokens are short-lived bearer JWTs; logout clears the frontend token but there is no server-side revocation/refresh-token flow.
- The frontend audit marks each mock-driven feature and unresolved contract decision; consult it before enabling the system for payroll or employee self-enrollment.
