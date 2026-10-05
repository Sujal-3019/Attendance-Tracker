const forgotCheckoutRecords = [
  {
    id: "FCO-001",
    employeeId: "EMP-001",
    employeeName: "Rahul Singh",
    employeeCode: "ATTENDLY01",
    department: "Engineering",
    attendanceDate: "2026-10-05",
    checkIn: "09:07",
    scheduledEndTime: "18:00",
    checkOut: null,
    currentStatus: "Checked In",

    locationStatus: "Verified",
    locationName: "Main Office Noida",

    overtimeEnabled: true,
    overtimeAfterMinutes: 30,

    // Overtime is intentionally not approved yet.
    overtimeDecision: null,
    overtimeStatus: "Not Applicable",
    overtimeHours: 0,

    notificationSentAt: "2026-10-05T18:15:00",

    adminNote: null,
    resolvedAt: null,
    resolvedBy: null,
  },
];

function delay(data, milliseconds = 250) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), milliseconds);
  });
}

export async function getForgotCheckoutRecords() {
  return delay([...forgotCheckoutRecords]);
}

export async function getForgotCheckoutRecordById(recordId) {
  const record = forgotCheckoutRecords.find(
    (item) => item.id === recordId,
  );

  if (!record) {
    throw new Error("Forgot checkout record not found.");
  }

  return delay({ ...record });
}

export async function resolveForgotCheckout(
  recordId,
  decision,
  adminNote,
) {
  const record = forgotCheckoutRecords.find(
    (item) => item.id === recordId,
  );

  if (!record) {
    throw new Error("Forgot checkout record not found.");
  }

  if (
    record.currentStatus !== "Checked In" &&
    record.currentStatus !== "Overtime Pending"
  ) {
    throw new Error(
      "This attendance record has already been resolved.",
    );
  }

  const validDecisions = [
    "MARK_CHECKOUT",
    "MARK_OVERTIME",
    "KEEP_PENDING",
  ];

  if (!validDecisions.includes(decision)) {
    throw new Error("Invalid checkout resolution.");
  }

  if (
    decision !== "KEEP_PENDING" &&
    !adminNote?.trim()
  ) {
    throw new Error(
      "An admin note is required when resolving the checkout.",
    );
  }

  if (decision === "MARK_CHECKOUT") {
    record.checkOut = record.scheduledEndTime;
    record.currentStatus = "Checked Out";

    record.overtimeDecision = "MARK_CHECKOUT";
    record.overtimeStatus = "Not Applicable";
    record.overtimeHours = 0;
  }

  if (decision === "MARK_OVERTIME") {
    record.checkOut = null;
    record.currentStatus = "Overtime Pending";

    record.overtimeDecision = "MARK_OVERTIME";
    record.overtimeStatus = "Pending";
    record.overtimeHours = 0;
  }

  if (decision === "KEEP_PENDING") {
    record.currentStatus = "Checked In";

    record.overtimeDecision = null;
    record.overtimeStatus = "Not Applicable";
    record.overtimeHours = 0;
  }

  record.adminNote = adminNote?.trim() || null;

  if (decision !== "KEEP_PENDING") {
    record.resolvedAt = new Date().toISOString();
    record.resolvedBy = "Demo Admin";
  } else {
    record.resolvedAt = null;
    record.resolvedBy = null;
  }

  return delay({ ...record });
}