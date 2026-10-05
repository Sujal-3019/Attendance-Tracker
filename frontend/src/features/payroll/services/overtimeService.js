const overtimeRequests = [
  {
    id: "OT-001",
    employeeId: "EMP-001",
    employeeCode: "ATTENDLY01",
    employeeName: "Rahul Singh",
    department: "Engineering",
    attendanceDate: "2026-10-05",

    checkIn: "09:07",
    scheduledEndTime: "18:00",
    checkOut: "20:14",

    overtimeHours: 0,
    overtimeStatus: "Pending",

    source: "Attendance",

    overtimeMultiplier: 1.5,
    hourlyRate: 0,
    calculatedOvertimePay: 0,

    reason:
      "Employee checked out after the scheduled end time.",

    submittedAt: "2026-10-05T20:14:00",
    reviewedAt: null,
    reviewedBy: null,
    reviewNote: null,
  },
];

function delay(data, milliseconds = 250) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), milliseconds);
  });
}

function parseTimeToMinutes(time) {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function calculateOvertimeDuration(
  scheduledEndTime,
  checkOut,
) {
  const scheduledEndMinutes =
    parseTimeToMinutes(scheduledEndTime);

  const checkoutMinutes =
    parseTimeToMinutes(checkOut);

  if (
    scheduledEndMinutes === null ||
    checkoutMinutes === null
  ) {
    return 0;
  }

  let overtimeMinutes =
    checkoutMinutes - scheduledEndMinutes;

  // Supports an overnight checkout.
  if (overtimeMinutes < 0) {
    overtimeMinutes += 24 * 60;
  }

  return Math.max(overtimeMinutes, 0);
}

function calculateOvertimeHours(request) {
  const overtimeMinutes =
    calculateOvertimeDuration(
      request.scheduledEndTime,
      request.checkOut,
    );

  return Number(
    (overtimeMinutes / 60).toFixed(2),
  );
}

function formatOvertimeDuration(hours) {
  if (!hours || hours <= 0) {
    return "0h";
  }

  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
}

function enrichOvertimeRequest(request) {
  const potentialOvertimeHours =
    calculateOvertimeHours(request);

  return {
    ...request,
    potentialOvertimeHours,
    potentialOvertimeDuration:
      formatOvertimeDuration(
        potentialOvertimeHours,
      ),
  };
}

export async function getOvertimeRequests() {
  return delay(
    overtimeRequests.map(enrichOvertimeRequest),
  );
}

export async function getOvertimeRequestById(
  requestId,
) {
  const request = overtimeRequests.find(
    (item) => item.id === requestId,
  );

  if (!request) {
    throw new Error("Overtime request not found.");
  }

  return delay(enrichOvertimeRequest(request));
}

export async function approveOvertime(
  requestId,
  overtimeHours,
  reviewNote,
) {
  const request = overtimeRequests.find(
    (item) => item.id === requestId,
  );

  if (!request) {
    throw new Error("Overtime request not found.");
  }

  if (request.overtimeStatus !== "Pending") {
    throw new Error(
      "Only pending overtime requests can be approved.",
    );
  }

  const hours = Number(overtimeHours);

  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error(
      "Approved overtime hours must be greater than zero.",
    );
  }

  if (hours > 24) {
    throw new Error(
      "Overtime hours cannot exceed 24 hours.",
    );
  }

  if (!reviewNote?.trim()) {
    throw new Error(
      "A review note is required when approving overtime.",
    );
  }

  request.overtimeHours = Number(
    hours.toFixed(2),
  );

  request.overtimeStatus = "Approved";

  request.calculatedOvertimePay = Number(
    (
      request.hourlyRate *
      request.overtimeHours *
      request.overtimeMultiplier
    ).toFixed(2),
  );

  request.reviewedAt =
    new Date().toISOString();

  request.reviewedBy = "Demo Admin";

  request.reviewNote =
    reviewNote.trim();

  return delay(
    enrichOvertimeRequest(request),
  );
}

export async function rejectOvertime(
  requestId,
  reviewNote,
) {
  const request = overtimeRequests.find(
    (item) => item.id === requestId,
  );

  if (!request) {
    throw new Error("Overtime request not found.");
  }

  if (request.overtimeStatus !== "Pending") {
    throw new Error(
      "Only pending overtime requests can be rejected.",
    );
  }

  if (!reviewNote?.trim()) {
    throw new Error(
      "A rejection note is required.",
    );
  }

  request.overtimeHours = 0;
  request.overtimeStatus = "Rejected";
  request.calculatedOvertimePay = 0;

  request.reviewedAt =
    new Date().toISOString();

  request.reviewedBy = "Demo Admin";

  request.reviewNote =
    reviewNote.trim();

  return delay(
    enrichOvertimeRequest(request),
  );
}