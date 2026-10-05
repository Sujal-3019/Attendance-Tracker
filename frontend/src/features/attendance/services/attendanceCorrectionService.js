const correctionRequests = [
  {
    id: "ACR-001",
    employeeId: "EMP-003",
    employeeName: "Aarav Sharma",
    employeeCode: "ATTENDLY03",
    department: "Operations",
    attendanceDate: "2026-09-30",
    originalCheckIn: "09:18",
    originalCheckOut: "18:02",
    requestedCheckIn: "09:00",
    requestedCheckOut: "18:02",
    reason: "I reached the office on time, but the check-in was not recorded correctly.",
    status: "Pending",
    submittedAt: "2026-10-05T13:35:00",
    reviewedAt: null,
    reviewedBy: null,
    reviewReason: null,
  },
  {
    id: "ACR-002",
    employeeId: "EMP-001",
    employeeName: "Rahul Singh",
    employeeCode: "ATTENDLY01",
    department: "Engineering",
    attendanceDate: "2026-09-29",
    originalCheckIn: "09:07",
    originalCheckOut: null,
    requestedCheckIn: "09:00",
    requestedCheckOut: "18:10",
    reason: "The attendance page stopped responding while I was checking out.",
    status: "Pending",
    submittedAt: "2026-09-30T10:15:00",
    reviewedAt: null,
    reviewedBy: null,
    reviewReason: null,
  },
  {
    id: "ACR-003",
    employeeId: "EMP-004",
    employeeName: "Neha Kapoor",
    employeeCode: "ATTENDLY04",
    department: "Marketing",
    attendanceDate: "2026-09-26",
    originalCheckIn: "09:21",
    originalCheckOut: "17:58",
    requestedCheckIn: "09:05",
    requestedCheckOut: "18:00",
    reason: "My browser lost connection during check-in.",
    status: "Approved",
    submittedAt: "2026-09-27T09:10:00",
    reviewedAt: "2026-09-27T11:30:00",
    reviewedBy: "Demo Admin",
    reviewReason: "Attendance logs and location data support the correction.",
  },
  {
    id: "ACR-004",
    employeeId: "EMP-007",
    employeeName: "Ananya Gupta",
    employeeCode: "ATTENDLY07",
    department: "Finance",
    attendanceDate: "2026-09-24",
    originalCheckIn: "09:42",
    originalCheckOut: "18:05",
    requestedCheckIn: "09:00",
    requestedCheckOut: "18:05",
    reason: "I forgot to check in when I arrived at the office.",
    status: "Rejected",
    submittedAt: "2026-09-25T08:45:00",
    reviewedAt: "2026-09-25T10:20:00",
    reviewedBy: "Demo Admin",
    reviewReason: "No supporting attendance or location evidence was available.",
  },
];

function delay(data, milliseconds = 250) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), milliseconds);
  });
}

export async function getCorrectionRequests() {
  return delay([...correctionRequests]);
}

export async function getCorrectionRequestById(requestId) {
  const request = correctionRequests.find(
    (item) => item.id === requestId,
  );

  if (!request) {
    throw new Error("Attendance correction request not found.");
  }

  return delay({ ...request });
}

export async function approveCorrection(requestId, reviewReason) {
  const request = correctionRequests.find(
    (item) => item.id === requestId,
  );

  if (!request) {
    throw new Error("Attendance correction request not found.");
  }

  if (request.status !== "Pending") {
    throw new Error("Only pending correction requests can be approved.");
  }

  request.status = "Approved";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = "Demo Admin";
  request.reviewReason =
    reviewReason?.trim() ||
    "Attendance correction approved after review.";

  return delay({ ...request });
}

export async function rejectCorrection(requestId, reviewReason) {
  const request = correctionRequests.find(
    (item) => item.id === requestId,
  );

  if (!request) {
    throw new Error("Attendance correction request not found.");
  }

  if (request.status !== "Pending") {
    throw new Error("Only pending correction requests can be rejected.");
  }

  if (!reviewReason?.trim()) {
    throw new Error("A rejection reason is required.");
  }

  request.status = "Rejected";
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = "Demo Admin";
  request.reviewReason = reviewReason.trim();

  return delay({ ...request });
}