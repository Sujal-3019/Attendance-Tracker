# Frontend Audit

Audit source: `frontend/src` (routes, pages, feature services, schemas, and shared API utilities).
This report records the existing UI contract before backend implementation. The current frontend is a demonstration application: the feature services use in-memory fixtures and delays, and do not call the API helper.

## 1. Current frontend architecture

- React 19 + Vite, JavaScript/JSX, React Router 7, Tailwind CSS v4, Base UI/shadcn-style components, Lucide, Recharts, and Zod schemas.
- Feature-oriented modules under `frontend/src/features`; `App.jsx` defines route visibility, and `ProtectedRoute` checks the role held in React context.
- Feature pages call asynchronous service functions from `useEffect`/local handlers and keep their state locally. TanStack Query is installed but not used by the audited pages.
- `frontend/src/lib/api.js` provides a generic `fetch` wrapper and reads `VITE_API_BASE_URL` (defaults to `http://localhost:8000`), but no feature service uses it. `apiHealth.js` is a separate health helper.
- `AuthContext` holds only an in-memory user object. There is no persistence, token renewal, server identity check, or backend authorization.
- Browser `localStorage` is used only by the theme toggle. There is no frontend route for an employee to edit attendance history directly; corrections and forgotten checkout are admin workflows.

## 2. Implemented features by role

### Public / authentication

- Landing page and public register-choice page.
- Login form; admin organization registration form; employee registration form using an organization code.
- Client-side schemas require email/password, password minimum 8 characters, Indian mobile format, organization names/types, and matching confirmation fields.
- Authentication is currently simulated. `authService.js` accepts `password123` for two hardcoded accounts, returns role-bearing mock users, accepts only `ATTENDLY01` for employee sign-up, and returns a mock admin for public organization registration.
- `ProtectedRoute` uses only `AuthContext.user.role` and redirects to the admin or employee dashboard.

### Administrator

- Dashboard cards, attendance overview/chart, and recent attendance.
- Attendance list and summary, correction requests with approve/reject, and forgotten-checkout requests with resolution. UI supports search/status/date filters and summary figures.
- Employee list, detail, create/edit, active/inactive status, and employee attendance/payroll detail views. Employee schemas include identity/contact, employee code, department, designation, employment type, work mode/location, joining date, and status.
- Leave request review, statistics, balances, and leave-policy CRUD/status. Policy schema includes code, paid flag, annual allocation, carry-forward, and max consecutive days.
- Payroll month/year selection, employee payroll calculations and finalization, payroll summary/detail, salary advances/repayments/settlement and repayment rules, and overtime approval/rejection.
- Settings for organization profile, attendance policy, work locations (including coordinates/radius/primary/status), and payroll calculation parameters.
- Notifications list, unread count, mark one/all read.

### Employee

- Employee dashboard and profile view/update.
- Attendance today/history, check-in/check-out, and reset check-in/check-out controls.
- Leave balance/history and leave application.
- Payroll history, payslip, and salary projection.
- Salary advances view.

### Shared

- Theme toggle, responsive admin/employee shells, common form dialogs/tables, loading/error/empty-state handling, and toast/inline feedback.

## 3. Existing service functions and proposed API mapping

Every service below is presently fixture-backed. Request fields follow current form/service arguments; response shapes should preserve current camelCase naming where feasible. Paginated list contracts are to return `{ items, total, page, pageSize }`; adapters in the frontend can retain current array consumers while migration is in progress.

| Frontend service function | Proposed endpoint and request | Expected response |
|---|---|---|
| `registerAdmin(payload)` | No public endpoint. Replace with documented provisioning workflow; public administrator creation is unsafe. | N/A; UI must explain restricted provisioning. |
| `loginUser({ email, password })` | `POST /api/v1/auth/login` JSON credentials | access token + authenticated `{ user }`; no password/hash |
| `registerEmployee(payload)` | `POST /api/v1/auth/register` `{ organizationCode, fullName, email, phone, password }`; only enabled enrollment codes | `{ success, user, organization }` |
| `getEmployees()` | `GET /api/v1/employees` filters/page/pageSize | employee list with current profile fields |
| `getEmployeeById(id)`, `getEmployeeDetails(id)` | `GET /api/v1/employees/{id}` | employee profile plus allowed attendance/payroll/leave details |
| `getEmployeeStats()` | `GET /api/v1/employees/summary` | count/status/department summaries |
| `createEmployee(data)` | `POST /api/v1/employees` | created employee |
| `updateEmployee(id, data)` | `PATCH /api/v1/employees/{id}` | updated employee |
| `updateEmployeeStatus(id, status)` | `PATCH /api/v1/employees/{id}/status` `{ status }` | updated status |
| `getAttendanceSummary()` | `GET /api/v1/attendance/summary` with date filters | present/absent/late/on-leave totals |
| `getAttendanceRecords()` | `GET /api/v1/attendance` with date/search/status filters | attendance items |
| `getCorrectionRequests()`, `getCorrectionRequestById(id)` | `GET /api/v1/attendance/corrections[/{id}]` | request records including original/proposed timestamps, reason and decision |
| `approveCorrection(id, reviewReason)`, `rejectCorrection(id, reviewReason)` | `POST /api/v1/attendance/corrections/{id}/approve|reject` `{ reviewReason }` | updated request and audited attendance state |
| `getForgotCheckoutRecords()`, `getForgotCheckoutRecordById(id)` | `GET /api/v1/attendance/forgot-checkout[/{id}]` | outstanding/closed requests |
| `resolveForgotCheckout(id, data)` | `POST /api/v1/attendance/forgot-checkout/{id}/resolve` | updated request and audited check-out |
| `getMyAttendance()` | `GET /api/v1/me/attendance` | `{ today, history, summary }` |
| `checkIn()`, `checkOut()` | `POST /api/v1/me/attendance/check-in|check-out` | Office-mode and scheduled Hybrid office-day check-ins obtain precise browser coordinates and send `{ latitude, longitude, accuracy }`; the server requires the accuracy circle inside an active office geofence. Remote employees and Hybrid remote days send an empty JSON object. |
| `resetCheckIn()`, `resetCheckOut()` | `POST /api/v1/me/attendance/corrections` `{ event, reason }` | correction request; never erase event history |
| `getLeaveRequests()` | `GET /api/v1/leaves/requests` filters/page | leave request items |
| `getLeaveStats()` | `GET /api/v1/leaves/summary` | pending/approved/rejected totals |
| `getLeaveBalances()` | `GET /api/v1/leaves/balances` | employee/type allocation, used, remaining |
| `getLeaveRequestById(id)` | `GET /api/v1/leaves/requests/{id}` | leave detail |
| `approveLeave(id)`, `rejectLeave(id, reason)` | `POST /api/v1/leaves/requests/{id}/approve|reject` | updated request; approval and ledger update atomically |
| `getLeavePolicies()`, `getLeavePolicyById(id)` | `GET /api/v1/leave-types[/{id}]` | policy/type details |
| `createLeavePolicy(data)`, `updateLeavePolicy(id, data)`, `updateLeavePolicyStatus(id, status)` | `POST/PATCH /api/v1/leave-types[/{id}]` | saved type |
| `getMyLeaves()`, `applyForLeave(payload)` | `GET/POST /api/v1/me/leaves` | own requests / created request |
| `getPayrollEmployees(month, year)` | `GET /api/v1/payroll/employees?month=&year=` | payroll estimates or finalized snapshots |
| `getEmployeePayroll(id, month, year)` | `GET /api/v1/payroll/employees/{id}?month=&year=` | payroll detail and line items |
| `getPayrollSummary(month, year)` | `GET /api/v1/payroll/summary?month=&year=` | totals and row counts |
| `finalizePayroll(id, month, year)` | `POST /api/v1/payroll/employees/{id}/finalize?month=&year=` | immutable payroll estimate snapshot for a closed period |
| `getMyPayroll()`, `getMyPayslip(id)`, `getMySalaryProjection()` | `GET /api/v1/me/payroll[/{id}|/projection]` | own finalized estimates and assigned salary |
| `updateMyTaxRegime(regime)` | `PATCH /api/v1/me/payroll/tax-regime` `{ taxRegime: "old" \| "new" }` | saved employee preference; does not calculate TDS |
| `getSalaryAdvances()`, `getEmployeeSalaryAdvances(id)` | `GET /api/v1/advances[?employee_id=]` | advance, repayment, outstanding values |
| `createSalaryAdvance(payload)` | `POST /api/v1/advances` | created request/advance; approval semantics to confirm |
| `recordAdvanceRepayment(id, payload)`, `settleSalaryAdvance(id)`, `updateAdvanceRepaymentRule(...)` | `POST/PATCH /api/v1/advances/{id}/repayments|settle|repayment-rule` | transaction history and remaining balance; payroll installments are created atomically during finalization |
| `getOvertimeRequests()`, `getOvertimeRequestById(id)` | `GET /api/v1/overtime/requests[/{id}]` | request details |
| `approveOvertime(id, ...)`, `rejectOvertime(id, ...)` | `POST /api/v1/overtime/requests/{id}/approve|reject` | updated request with reviewer |
| `getOrganizationSettings()`, `updateOrganizationSettings(data)` | `GET/PATCH /api/v1/settings/organization` | organization settings |
| `getAttendancePolicy()`, `updateAttendancePolicy(data)` | `GET/PATCH /api/v1/settings/attendance-policy` | policy settings |
| `getWorkLocations()`, `createWorkLocation(data)`, `updateWorkLocation(id, data)`, `updateWorkLocationStatus(id, status)` | `GET/POST/PATCH /api/v1/settings/work-locations[/{id}]` | location records; coordinate values restricted |
| `getPayrollSettings()`, `updatePayrollSettings(data)` | `GET/PUT /api/v1/settings/payroll-policy` | default wage model and amount |
| `getDashboardStats()`, `getRecentAttendance()` | `GET /api/v1/dashboard/summary`, `/api/v1/dashboard/recent-attendance` | database-derived summary/chart points and latest entries |
| `getNotifications()`, `getUnreadNotificationCount()`, `markNotificationAsRead(id)`, `markAllNotificationsAsRead()` | `GET /api/v1/notifications`, `/unread-count`, `PATCH /{id}/read`, `/read-all` | scoped notification(s)/count |
| `getMyProfile()`, `updateMyProfile(updates)` | `GET/PATCH /api/v1/me/profile` | authenticated employee profile; restricted editable fields |

## 4. Mock data and hardcoded rules

- Every service listed above currently keeps fixtures in module-level arrays/objects, uses artificial delays, and mutates in-memory values. Reloading loses updates; server-side authorization and persistence do not exist.
- Demo employee IDs/codes, names, salary/attendance/leave histories, organizations, notifications, corrections, forgotten checkouts, overtime, and balances are embedded in those fixtures. These must not be migrated as production seed data.
- Auth fixtures explicitly accept `password123`, `admin@a.com`, `employee@a.com`, and enrollment code `ATTENDLY01`; none is a real credential or valid production policy.
- Payroll calculations use configured working days, wage model, attendance, paid/unpaid approved leave, approved overtime, and capped advance installments. Income-tax TDS, EPF, ESI, and professional tax remain explicitly uncalculated pending verified rates and employer/employee statutory inputs; payroll results are estimates, not official payslips.
- Attendance page includes employee-level correction and forgotten checkout actions; employee reset actions are implemented as direct mock state mutations, not auditable requests.
- Theme preference is local storage only. Auth and role state are memory-only.
- API utility has a localhost default, but service modules do not use it; API errors are reduced to messages and there is no token handling.

## 5. Required entities and relationships

Minimum persistent entities justified by the UI: organization; user with role/active status and optional employee link; employee profile; attendance day/event and correction request/audit; leave type, leave request, balance ledger; organization/attendance/payroll settings; work location; payroll period/employee snapshot and line items; salary advance and repayment ledger; overtime request; notification. All organization-owned data must carry organization scope. Employee identity is derived from the authenticated user. Financial values use decimal types. Organization, account, profile, request, and transaction history must not be hard-deleted.

The current UI uses string IDs such as `EMP-001` and `ACR-001`; these are display identifiers, not safe persistence keys. The API will use UUID primary keys and keep a unique employee code for display and lookup. Leave approval must lock/check the request and balance in one transaction. Repayments must be immutable and may not exceed the outstanding amount.

## 6. Missing, ambiguous, or contradictory rules

- Public administrator registration conflicts with the requirement that no public endpoint can grant administrator privileges. The web flow is therefore limited to one initial organization and requires a private server-configured setup code; it cannot add organizations or promote accounts after bootstrap.
- Employee sign-up originally accepted a fixed demo organization code. The implemented backend now uses an admin-generated, reusable company code that can be rotated; email/phone ownership verification and automatic expiry remain unimplemented.
- Timezone/shift assignment to employees and treatment of overnight shifts are unspecified. Attendance policy values are configurable, but a single organization timezone is used initially. The meaning of `lateThresholdMinutes` relative to `gracePeriodMinutes` is not specified by the UI; check-in status currently uses the grace period only, and no guessed late/absence deductions are applied.
- The exact meanings of half-day, paid/unpaid leave, leave-year boundaries, holidays, carry-forward expiry, and whether pending requests reserve balances are unspecified. Pending requests do not deduct; approval creates a ledger transaction exactly once.
- Payroll settings expose formulas but legal/tax/statutory treatment, payroll cutoff, rounding, overtime eligibility, historical recalculation rules, and currency minor-unit policy need confirmation. Finalized payroll must snapshot inputs and not recalculate silently.
- Salary advance approval requirements and user-submitted repayment schedules are unclear. Financial actions are admin-only until policy is confirmed; repayment is recorded as a separate transaction.
- Browser location is untrusted. Although work-location coordinates/radius exist, do not claim GPS validation is anti-spoofing. Collection/storage should remain disabled until a privacy/retention policy is agreed.
- Dashboard date-range defaults, employee visibility scopes for admin manager roles, and notification delivery channels are not defined. Only admin and employee roles exist.
- Existing page code expects several slightly different identifiers/status labels and often expects arrays, while the API uses paginated envelopes. A frontend API adapter is needed to avoid breaking existing UI consumers.

## 7. Security and authorization requirements

- Backend authentication and current user are authoritative; frontend role checks are only navigation UX.
- Never expose public administrator promotion; provision the initial admin via a CLI command and require its input securely.
- Hash passwords with Argon2, use short-lived signed bearer access tokens with secrets from environment, and exclude hashes/tokens from responses/logs.
- Scope every employee query to authenticated employee unless an admin permission explicitly allows organization-scoped access. Check ownership on all detail/mutation routes.
- Admin-only payroll, employee management, organization settings, policy changes, attendance correction review, leave decisions, overtime decisions, and finance operations.
- Use server timestamps, idempotent state transitions, row locking for competing leave/repayment decisions, and audit records for corrections/financial decisions.
- Restrict CORS to configured frontend origins; do not expose location data beyond authorized flows; return generic credential/DB errors.

## 8. Prioritized implementation plan and feature status

1. **Audit (complete):** record routes, service contracts, fixtures, assumptions, and security constraints here.
2. **Foundation (in progress):** environment validation, synchronous SQLAlchemy/Psycopg, FastAPI v1, safe health and database-health checks, CORS, and error handling.
3. **Persistence/auth:** models and Alembic migration; verify existing database tables before any migration; implement login, `me`, admin CLI provisioning, enrollment restrictions.
4. **Core operations:** employees/profile; attendance and auditable corrections; leave requests/policies/ledger; settings/work locations.
5. **Finance/reports:** payroll snapshot foundation, advances/repayments, overtime decisions, dashboard summaries, and notifications.
6. **Frontend integration:** switch shared API/services to real calls, keep existing JS routes/components, add authenticated API handling, remove simulated credentials/fixture mutation.
7. **Verification/docs:** isolated tests, migration checks, API contract, Windows setup instructions, business-decision checklist.

Feature mapping status at audit time: all listed screens and workflows exist in the UI; no feature service was connected to a backend. The sections above preserve the original mock behavior observed during the audit.

## 9. Implementation status after the audit

- **Foundation:** FastAPI application, `/health` and `/health/db`, environment validation, PostgreSQL/Psycopg engine, CORS allowlist, versioned routes, and Alembic model metadata are implemented.
- **Persistence and authentication:** organization, employee, user, attendance/correction, leave/balance/ledger, settings/location, payroll snapshot, advance/repayment, overtime, and notification models are implemented. Login, current-user identity, employee registration, role guards, Argon2 password hashing, short-lived bearer tokens, one-time protected web registration for the first administrator, and CLI provisioning are implemented.
- **Employees:** organization-scoped employee list/details/create/update/status and self profile read/update endpoints are implemented. Admin employee creation atomically provisions the linked employee login account with an Argon2-hashed initial password; profile email/name/phone/status edits keep the login identity and activation state synchronized.
- **Attendance:** employee check-in/out and history, server-side event timestamps, configured organization-local date and late/grace calculation, admin filtering/summary, auditable correction review, and forgotten-checkout resolution are implemented. Unknown work schedules, location verification, and unsupported absence rules remain explicit limitations.
- **Leave:** type/policy management, employee application and own history, admin request review/statistics/balances, overlap checks, and transactional, ledger-backed approval are implemented. Leave-year/holiday/carry-forward decisions remain open.
- **Payroll and finance:** monthly/daily/hourly estimates, scheduled-day proration, paid/unpaid leave and absence treatment, approved overtime at 1.5×, capped idempotent advance installments, closed-period snapshot finalization, employee salary visibility, tax-regime preference, and CSV export/download are implemented. TDS, EPF, ESI, and professional tax remain uncalculated pending verified rates and employer/employee statutory configuration.
- **Settings, dashboard, and notifications:** organization/attendance/payroll settings, work locations, organization-local dashboard summary, database-backed current-week attendance chart, recent attendance, and user-scoped notification endpoints are implemented. Sample dashboard trend percentages were removed.
- **Frontend integration:** feature services use the shared HTTP helper and API contracts; simulated login/admin registration and fixture-backed feature service behavior were removed. Access tokens remain memory-only. Some unsupported payroll actions fail explicitly rather than returning mock success.
- **Verification:** 12 isolated pytest cases pass; frontend production build and Oxlint complete successfully; Alembic reports no model/schema drift. Before migration, the configured database was verified read-only and contained only an empty `alembic_version` table. The additive initial migration is now applied at revision `4ab385a0c838`; no existing application tables or data were replaced. `/health` and `/health/db` both return 200 against the configured database. Build chunk-size, linter, and Starlette/httpx deprecation warnings are non-fatal.
- **Remaining business decisions:** verified FY 2026–27 TDS schedule and required employee declarations; EPF/ESI coverage and component bases; state-specific professional-tax schedule; holiday calendars, partial-day leave, shift/overnight handling, employee enrollment-code lifecycle and email verification, and deployment-grade token revocation/monitoring.

### Employee self-registration and onboarding update (November 2026)

- Admins can generate or rotate the company code from the new **Company Code** navigation item. The plaintext is shown only in the successful generation response; rotation invalidates the previous code.
- Employee registration asks only for company code, email, phone, and password. It creates a sign-in-capable employee account with an incomplete profile rather than requiring an employee profile to be pre-created.
- Every active admin receives an actionable in-app notification linking to the employee edit page. Admin completion covers employee code/name, department, designation, manager, work type/location, wage model/base wage, and allocations for active leave types.
- Existing employees default to `profile_complete = true` in the additive Alembic migration. Self-registered employees remain incomplete until the admin details and leave allocations are saved. The frontend displays that state to employees and admins.
- Employee login now accepts email or phone. Ambiguous phone matches require email instead.
- Automatic code expiry, per-employee invitations, and contact ownership verification remain open operational/security decisions.

The API contract, including methods, access rules, request/response shapes, errors, and corresponding frontend service functions, is maintained in [API_CONTRACT.md](./API_CONTRACT.md). Setup and migration instructions are in [README.md](../README.md).
