
const wait = (ms = 250) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const leaveBalances = [
  { type: "Casual Leave", allowance: 12, used: 3 },
  { type: "Sick Leave", allowance: 10, used: 2 },
  { type: "Earned Leave", allowance: 15, used: 4 },
];

let leaveRequests = [
  {
    id: "LEAVE-001",
    type: "Casual Leave",
    startDate: "2026-09-18",
    endDate: "2026-09-18",
    days: 1,
    reason: "Personal work",
    status: "Approved",
    appliedOn: "2026-09-10",
  },
  {
    id: "LEAVE-002",
    type: "Sick Leave",
    startDate: "2026-09-29",
    endDate: "2026-09-30",
    days: 2,
    reason: "Medical rest",
    status: "Pending",
    appliedOn: "2026-09-27",
  },
];

function clone(value) {
  return structuredClone(value);
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  return Math.floor((end - start) / 86400000) + 1;
}

export async function getMyLeaves() {
  await wait();

  return {
    balances: clone(leaveBalances),
    requests: clone(leaveRequests),
  };
}

export async function applyForLeave(payload) {
  await wait();

  const { type, startDate, endDate, reason } = payload;

  if (!type || !startDate || !endDate || !reason?.trim()) {
    throw new Error("Please complete all required fields.");
  }

  if (startDate < getLocalDateKey()) {
    throw new Error("Leave start date cannot be in the past.");
  }

  if (endDate < startDate) {
    throw new Error("End date cannot be before the start date.");
  }

  if (!leaveBalances.some((balance) => balance.type === type)) {
    throw new Error("Please select a valid leave type.");
  }

  if (reason.trim().length < 5) {
    throw new Error("Please provide a reason of at least 5 characters.");
  }

  const overlappingRequest = leaveRequests.some((request) => {
    const overlaps =
      startDate <= request.endDate && endDate >= request.startDate;

    return (
      overlaps &&
      ["Pending", "Approved"].includes(request.status)
    );
  });

  if (overlappingRequest) {
    throw new Error(
      "You already have a pending or approved leave request for overlapping dates.",
    );
  }

  const request = {
    id: `LEAVE-${Date.now()}`,
    type,
    startDate,
    endDate,
    days: calculateDays(startDate, endDate),
    reason: reason.trim(),
    status: "Pending",
    appliedOn: getLocalDateKey(),
  };

  leaveRequests = [request, ...leaveRequests];

  return clone(request);
}
