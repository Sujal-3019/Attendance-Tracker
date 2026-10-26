# API Contract

Base path: `/api/v1`. JSON uses camelCase field names unless noted. UUIDs are server-generated identifiers. Authenticated requests send `Authorization: Bearer <accessToken>`; the frontend holds the 15-minute access token in memory. Admin routes are organization-scoped. Employee routes derive employee identity from the authenticated account and do not trust an employee ID supplied by the caller.

Paginated endpoints return `{ items, total, page, pageSize }`. Validation errors use FastAPI's `422` response with `detail`; application errors use `{ "detail": "..." }`. Common status codes: `400` invalid enrollment code, `401` invalid/missing authentication, `403` role/ownership violation, `404` missing or out-of-scope record, `409` invalid state transition or conflict, `422` invalid input, `503` database unavailable.

## Authentication and employee profile

| Method and endpoint | Access / purpose | Request | Response and frontend mapping |
|---|---|---|---|
| `POST /auth/login` | Public login | `{ email, password }` | `{ success, accessToken, tokenType, expiresIn, user, organization }`; `loginUser` |
| `GET /auth/admin-registration/status` | Public setup availability; does not reveal setup code | None | `{ available }`, true only when `ADMIN_SETUP_CODE` is configured and no organization exists; `getAdminRegistrationStatus` |
| `POST /auth/register/admin` | Public first-admin setup, protected by the server-configured one-time setup code; atomically closes when the first organization is created | `{ setupCode, organizationName, organizationType, fullName, email, phone, password }` | Auth response plus one-time `employeeEnrollmentCode`; frontend `registerAdmin` |
| `POST /auth/register/employee` | Public employee enrollment, but requires a pre-created active employee and matching identity | `{ organizationCode, fullName, email, phone, password }` | Same auth response as login; `registerEmployee` |
| `GET /auth/me` | Authenticated identity and role | None | `{ id, name, email, role, organizationId, employeeId }`; source of truth for current user |
| `GET /me/profile` | Employee self only | None | Employee profile: employee code, name, email, phone, department, designation, employment type, joining date, work mode, manager; `getMyProfile` |
| `PATCH /me/profile` | Employee self only | `{ phone }` | Updated profile; `updateMyProfile` |

Admin registration is not generally open: the server operator must configure the private `ADMIN_SETUP_CODE`, and only one successful organization registration is allowed. PostgreSQL advisory locking serializes simultaneous attempts. The setup code is never returned by the availability endpoint or logged. Existing installations with an organization must continue using an existing admin account; this route cannot add or promote administrators.

## Employees

| Method and endpoint | Access / purpose | Request | Response and frontend mapping |
|---|---|---|---|
| `GET /employees?page=&page_size=&search=&department=&status=` | Admin list, max page size 100 | Optional query filters | `{ items: [{ ..., attendance: { present, late } }], total, page, pageSize }`; attendance counts cover the current month and are aggregated in one grouped query; `getEmployees` |
| `GET /employees/summary` | Admin employee count/status summary | None | Count object; `getEmployeeStats` |
| `POST /employees` | Admin create employee and linked login account atomically | `employeeCode, name, email, password, phone, department, designation, manager, employmentType, workMode, location, joiningDate, status?, wageModel?, baseWage?`; password is 8-128 characters | Employee profile only; password/hash are never returned. The employee signs in with the supplied email/password; `createEmployee` |
| `GET /employees/{employeeId}` | Admin details, same organization only | UUID path | Employee detail including permitted attendance/payroll information; `getEmployeeById`, `getEmployeeDetails` |
| `PATCH /employees/{employeeId}` | Admin update, same organization only | Partial editable employee profile; never role/password | Updated employee; `updateEmployee` |
| `PATCH /employees/{employeeId}/status` | Admin activate/deactivate | `{ status: "Active" \| "Inactive" }` | Updated employee; `updateEmployeeStatus` |

Employee salaries are decimal values. Creating an employee creates an `employee`-role login account in the same transaction. If either record fails, neither is saved. Inactive employees receive inactive accounts and cannot sign in until activated. Editing an employee's email, name, phone, or status synchronizes the linked login identity/status; editing never changes the password.

## Attendance and corrections

| Method and endpoint | Access / purpose | Request | Response and frontend mapping |
|---|---|---|---|
| `GET /me/attendance?page=&page_size=` | Employee self history | Pagination | `{ today, history }`; `getMyAttendance` |
| `POST /me/attendance/check-in` | Employee self check-in; server timestamp and organization-local date | Empty JSON | Current record `{ id, date, checkIn, checkOut, status, workedHours }`; `checkIn` |
| `POST /me/attendance/check-out` | Employee self check-out after check-in | Empty JSON | Updated attendance record; `checkOut` |
| `POST /me/attendance/corrections` | Employee requests auditable check-in/out correction | `{ event: "check_in" \| "check_out", reason }` | Correction with original/requested values and pending status; `resetCheckIn`, `resetCheckOut` |
| `GET /attendance?date=&search=&status=&page=&page_size=` | Admin organization attendance list | Optional filters, pagination max 100 | `{ items, total, page, pageSize }`; `getAttendanceRecords` |
| `GET /attendance/summary?date=` | Admin daily totals; omitted date means organization-local today | Optional ISO date | `{ date, present, late, absent, onLeave, unmarked, total, totalEmployees }`; `getAttendanceSummary` |
| `GET /attendance/corrections?status=` | Admin review queue | Optional status | Correction list; `getCorrectionRequests` |
| `GET /attendance/corrections/{correctionId}` | Admin correction detail | UUID path | Correction detail; `getCorrectionRequestById` |
| `POST /attendance/corrections/{correctionId}/approve` | Admin approve; preserves event history | `{ reviewReason }` | Updated correction and attendance; `approveCorrection` |
| `POST /attendance/corrections/{correctionId}/reject` | Admin reject | `{ reviewReason }` | Updated correction; `rejectCorrection` |
| `GET /attendance/forgot-checkout` | Admin open-checkout queue | None | Open attendance records; `getForgotCheckoutRecords` |
| `GET /attendance/forgot-checkout/{attendanceId}` | Admin detail | UUID path | Open attendance detail; `getForgotCheckoutRecordById` |
| `POST /attendance/forgot-checkout/{attendanceId}/resolve` | Admin resolve forgotten checkout | `{ decision, adminNote }` | Updated record; `resolveForgotCheckout` |

Correction routes do not delete original events. Browser-supplied timestamps and GPS are not accepted as authoritative; location spoofing protection is not claimed. Attendance late status uses configured work start/grace settings when present. Unknown/unsupported absence and overnight-shift policies are not inferred.

## Leave management

| Method and endpoint | Access / purpose | Request | Response and frontend mapping |
|---|---|---|---|
| `GET /leaves/requests?status=&search=&page=&page_size=` | Admin request list | Optional filters | `{ items, total, page, pageSize }`; `getLeaveRequests` |
| `GET /leaves/summary` | Admin request counts | None | Status totals; `getLeaveStats` |
| `GET /leaves/balances` | Admin balance overview | None | Employee/type allocations and remaining balances; `getLeaveBalances` |
| `GET /leaves/requests/{requestId}` | Admin request detail | UUID path | Request, employee, dates, decision data; `getLeaveRequestById` |
| `POST /leaves/requests/{requestId}/approve` | Admin approval | Empty JSON | Updated request; balance and ledger update commit atomically; `approveLeave` |
| `POST /leaves/requests/{requestId}/reject` | Admin rejection | `{ rejectionReason? }` | Updated request; `rejectLeave` |
| `GET /leave-types` | Authenticated user | None | Active leave types; `getLeavePolicies` |
| `GET /leave-types/{typeId}` | Authenticated user | UUID path | Leave policy; `getLeavePolicyById` |
| `POST /leave-types` | Admin create policy | `{ name, code, description, annualAllocation, paid, carryForward, maxConsecutiveDays }` | Created leave type; `createLeavePolicy` |
| `PATCH /leave-types/{typeId}` | Admin edit policy | Partial policy fields | Updated type; `updateLeavePolicy` |
| `PATCH /leave-types/{typeId}/status` | Admin activate/deactivate | `{ status: "Active" \| "Inactive" }` | Updated type; `updateLeavePolicyStatus` |
| `GET /me/leaves` | Employee self requests and balance context | None | Own requests/balances; `getMyLeaves` |
| `POST /me/leaves` | Employee self apply | `{ type, startDate, endDate, reason }` | Created pending request; `applyForLeave` |

Pending requests do not consume balance. Approval checks overlap and updates the ledger exactly once. Leave-year boundaries, holiday counting, and carry-forward expiry remain unconfirmed policy decisions.

## Payroll, advances, and overtime

| Method and endpoint | Access / purpose | Request | Response and frontend mapping |
|---|---|---|---|
| `GET /payroll/employees?month=&year=` | Admin payroll period overview | Month/year; defaults to current UTC period | Employee payroll rows/snapshots; `getPayrollEmployees` |
| `GET /payroll/employees/{employeeId}?month=&year=` | Admin employee period detail | Employee UUID and optional period | Employee payroll row; `getEmployeePayroll` |
| `GET /payroll/summary?month=&year=` | Admin period totals | Optional period | Summary totals; `getPayrollSummary` |
| `POST /payroll/employees/{employeeId}/finalize?month=&year=` | Admin only; intentionally blocked pending confirmed calculation rules | Optional period | `409` with explicit policy-not-ready detail; `finalizePayroll` |
| `GET /me/payroll` | Employee own finalized history | None | Own snapshots only; `getMyPayroll` |
| `GET /me/payroll/{payslipId}` | Employee own payslip only | UUID path | Snapshot/payslip or `404`; `getMyPayslip` |
| `GET /me/payroll/projection` | Employee self | None | `{ available: false, reason, wageModel, baseWage }`; `getMySalaryProjection` |
| `GET /advances?employee_id=` | Admin advances and repayment ledger | Optional employee UUID | Advance records including decimal outstanding and repayments; `getSalaryAdvances` |
| `GET /me/advances` | Employee's own advances | None | Own advance/repayment records; `getEmployeeSalaryAdvances` |
| `POST /advances` | Admin issue advance | `{ employeeId, originalAmount, monthlyDeduction, startMonth, reason }` | Created decimal advance; `createSalaryAdvance` |
| `POST /advances/{advanceId}/repayments` | Admin record repayment; requires `Idempotency-Key` header (8-100 chars) | `{ amount, date?, method, note? }` | Updated advance with repayment ledger; `recordAdvanceRepayment` |
| `POST /advances/{advanceId}/settle` | Admin settle remaining amount | Empty JSON | Updated advance and settlement transaction; `settleSalaryAdvance` |
| `PATCH /advances/{advanceId}/repayment-rule` | Admin update repayment terms | `{ monthlyDeduction, startMonth }` | Updated advance; `updateAdvanceRepaymentRule` |
| `POST /payroll/settle-advance-deductions` | No endpoint currently exposed | N/A | Frontend service `settleSalaryAdvance` is mapped to the explicit settlement endpoint; `settlePayrollAdvanceDeductions` remains unsupported pending payroll policy |
| `GET /overtime/requests?status=` | Admin overtime review queue | Optional status | Request list; `getOvertimeRequests` |
| `GET /overtime/requests/{requestId}` | Admin detail | UUID path | Overtime request; `getOvertimeRequestById` |
| `POST /overtime/requests/{requestId}/approve` | Admin approve | `{ overtimeHours, reviewNote }` | Updated request; `approveOvertime` |
| `POST /overtime/requests/{requestId}/reject` | Admin reject | `{ reviewNote }` | Updated request; `rejectOvertime` |

Historical payroll calculation is not finalized or silently recomputed. The `settlePayrollAdvanceDeductions` frontend function has no equivalent backend operation because payroll deduction policy is not confirmed; it must not be called as if successful.

## Dashboard, settings, notifications, and health

| Method and endpoint | Access / purpose | Request | Response and frontend mapping |
|---|---|---|---|
| `GET /dashboard/summary` | Admin dashboard | None; organization-local current day | `{ totalEmployees, presentToday, lateToday, onLeaveToday }`; `getDashboardStats` |
| `GET /dashboard/recent-attendance` | Admin dashboard recent activity | None | Up to 10 recent attendance rows; `getRecentAttendance` |
| `GET /dashboard/attendance-chart` | Admin current-week chart | None; Monday-Sunday in organization timezone | `{ weekStart, weekEnd, items: [{ date, day, present, late, leave, absent }] }`; absent is `null` on nonworking/incomplete days and derives from missing active-employee records only after a configured workday is complete; `getAttendanceChart` / `AttendanceOverview` |
| `GET /settings/organization` / `PATCH /settings/organization` | Admin organization profile | Full profile on patch: name, email, phone, address, IANA timezone, currency, date format | Saved profile; `getOrganizationSettings`, `updateOrganizationSettings` |
| `GET /settings/attendance-policy` / `PUT /settings/attendance-policy` | Admin attendance policy | Work start/end, grace/late thresholds, working hours/days, early checkout and overtime switches | Saved policy; `getAttendancePolicy`, `updateAttendancePolicy` |
| `GET /settings/payroll-policy` / `PUT /settings/payroll-policy` | Admin policy only; values are not used to finalize payroll until confirmed | Wage model and policy fields defined by `PayrollPolicy` schema | Saved policy; `getPayrollSettings`, `updatePayrollSettings` |
| `GET /settings/work-locations` | Admin locations | None | Location list; `getWorkLocations` |
| `POST /settings/work-locations` | Admin create location | `{ name, address, latitude, longitude, radiusMeters, primary }` | Created location; `createWorkLocation` |
| `PATCH /settings/work-locations/{locationId}` | Admin edit location | Partial location fields | Updated location; `updateWorkLocation` |
| `PATCH /settings/work-locations/{locationId}/status` | Admin activate/deactivate | `{ status: "Active" \| "Inactive" }` | Updated location; `updateWorkLocationStatus` |
| `GET /notifications?page=&page_size=` | Authenticated user; own notifications only | Pagination | `{ items, total, page, pageSize }`; `getNotifications` |
| `GET /notifications/unread-count` | Authenticated user | None | `{ count }`; `getUnreadNotificationCount` |
| `PATCH /notifications/{notificationId}/read` | Authenticated user, own notification | None | `{ id, read: true }`; `markNotificationAsRead` |
| `PATCH /notifications/read-all` | Authenticated user | None | `{ updated }`; `markAllNotificationsAsRead` |
| `GET /health` and `GET /api/v1/health` | Public liveness | None | `{ status: "ok" }` |
| `GET /health/db` and `GET /api/v1/health/db` | Public readiness | None | `{ status: "ok", database: "available" }` or safe `503`; frontend health helper |

The frontend function `getEmployeePayroll` and current employee payroll routes are supported; no mocked financial totals are returned as finalized results. Existing UI service arrays are adapted only where the service client explicitly unwraps a page response.
