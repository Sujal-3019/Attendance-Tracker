import { getLeavePolicies } from "./leavePolicyService";

const leaveRequests = [
  {
    id: "LR-001",
    employeeId: "EMP-002",
    employeeName: "Priya Verma",
    employeeEmail: "priya.verma@attendly.demo",
    department: "Human Resources",
    leaveType: "Casual Leave",
    startDate: "2026-10-06",
    endDate: "2026-10-07",
    days: 2,
    reason: "Personal work",
    status: "Pending",
    appliedOn: "2026-10-03",
    reviewedOn: null,
    reviewedBy: null,
    rejectionReason: null,
  },
  {
    id: "LR-002",
    employeeId: "EMP-003",
    employeeName: "Rahul Singh",
    employeeEmail: "rahul.singh@attendly.demo",
    department: "Sales",
    leaveType: "Sick Leave",
    startDate: "2026-10-01",
    endDate: "2026-10-02",
    days: 2,
    reason: "Not feeling well",
    status: "Approved",
    appliedOn: "2026-09-30",
    reviewedOn: "2026-09-30",
    reviewedBy: "Demo Admin",
    rejectionReason: null,
  },
  {
    id: "LR-003",
    employeeId: "EMP-005",
    employeeName: "Vikram Patel",
    employeeEmail: "vikram.patel@attendly.demo",
    department: "Operations",
    leaveType: "Casual Leave",
    startDate: "2026-10-10",
    endDate: "2026-10-10",
    days: 1,
    reason: "Family function",
    status: "Pending",
    appliedOn: "2026-10-02",
    reviewedOn: null,
    reviewedBy: null,
    rejectionReason: null,
  },
  {
    id: "LR-004",
    employeeId: "EMP-006",
    employeeName: "Neha Kapoor",
    employeeEmail: "neha.kapoor@attendly.demo",
    department: "Design",
    leaveType: "Earned Leave",
    startDate: "2026-09-28",
    endDate: "2026-09-30",
    days: 3,
    reason: "Planned vacation",
    status: "Approved",
    appliedOn: "2026-09-15",
    reviewedOn: "2026-09-16",
    reviewedBy: "Demo Admin",
    rejectionReason: null,
  },
  {
    id: "LR-005",
    employeeId: "EMP-001",
    employeeName: "Aarav Sharma",
    employeeEmail: "aarav.sharma@attendly.demo",
    department: "Engineering",
    leaveType: "Casual Leave",
    startDate: "2026-09-22",
    endDate: "2026-09-22",
    days: 1,
    reason: "Personal work",
    status: "Rejected",
    appliedOn: "2026-09-20",
    reviewedOn: "2026-09-21",
    reviewedBy: "Demo Admin",
    rejectionReason: "Important project deployment scheduled on this date.",
  },
  {
    id: "LR-006",
    employeeId: "EMP-008",
    employeeName: "Kavya Nair",
    employeeEmail: "kavya.nair@attendly.demo",
    department: "Marketing",
    leaveType: "Sick Leave",
    startDate: "2026-09-18",
    endDate: "2026-09-18",
    days: 1,
    reason: "Medical appointment",
    status: "Approved",
    appliedOn: "2026-09-17",
    reviewedOn: "2026-09-17",
    reviewedBy: "Demo Admin",
    rejectionReason: null,
  },
  {
    id: "LR-007",
    employeeId: "EMP-004",
    employeeName: "Ananya Gupta",
    employeeEmail: "ananya.gupta@attendly.demo",
    department: "Finance",
    leaveType: "Earned Leave",
    startDate: "2026-10-15",
    endDate: "2026-10-17",
    days: 3,
    reason: "Family vacation",
    status: "Pending",
    appliedOn: "2026-10-03",
    reviewedOn: null,
    reviewedBy: null,
    rejectionReason: null,
  },
  {
    id: "LR-008",
    employeeId: "EMP-007",
    employeeName: "Rohan Mehta",
    employeeEmail: "rohan.mehta@attendly.demo",
    department: "Engineering",
    leaveType: "Unpaid Leave",
    startDate: "2026-09-08",
    endDate: "2026-09-09",
    days: 2,
    reason: "Personal reasons",
    status: "Rejected",
    appliedOn: "2026-09-05",
    reviewedOn: "2026-09-06",
    reviewedBy: "Demo Admin",
    rejectionReason: "Leave balance and project requirements did not permit the requested leave.",
  },
];

const leaveBalances = [
  {
    employeeId: "EMP-001",
    employeeName: "Aarav Sharma",
    casual: { allocated: 12, used: 3, remaining: 9 },
    sick: { allocated: 6, used: 1, remaining: 5 },
    earned: { allocated: 15, used: 2, remaining: 13 },
  },
  {
    employeeId: "EMP-002",
    employeeName: "Priya Verma",
    casual: { allocated: 12, used: 4, remaining: 8 },
    sick: { allocated: 6, used: 0, remaining: 6 },
    earned: { allocated: 15, used: 3, remaining: 12 },
  },
  {
    employeeId: "EMP-003",
    employeeName: "Rahul Singh",
    casual: { allocated: 12, used: 2, remaining: 10 },
    sick: { allocated: 6, used: 2, remaining: 4 },
    earned: { allocated: 15, used: 1, remaining: 14 },
  },
  {
    employeeId: "EMP-004",
    employeeName: "Ananya Gupta",
    casual: { allocated: 12, used: 1, remaining: 11 },
    sick: { allocated: 6, used: 0, remaining: 6 },
    earned: { allocated: 15, used: 3, remaining: 12 },
  },
];

const leaveTypeToBalanceKey = {
  "Casual Leave": "casual",
  "Sick Leave": "sick",
  "Earned Leave": "earned",
};

async function getPolicyForLeaveType(leaveType) {
  const policies = await getLeavePolicies();

  return policies.find(
    (policy) =>
      policy.name.toLowerCase() === leaveType.toLowerCase(),
  );
}

async function validateLeaveRequest(request) {
  const policy = await getPolicyForLeaveType(
    request.leaveType,
  );

  if (!policy) {
    throw new Error(
      `No leave policy found for ${request.leaveType}`,
    );
  }

  if (policy.status !== "Active") {
    throw new Error(
      `${request.leaveType} is currently inactive`,
    );
  }

  if (request.days > policy.maxConsecutiveDays) {
    throw new Error(
      `${request.leaveType} allows a maximum of ${policy.maxConsecutiveDays} consecutive days`,
    );
  }

  return policy;
}

function delay(data, milliseconds = 300) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), milliseconds);
  });
}

export async function getLeaveRequests() {
  return delay([...leaveRequests]);
}

export async function getLeaveStats() {
  const total = leaveRequests.length;

  const pending = leaveRequests.filter(
    (request) => request.status === "Pending",
  ).length;

  const approved = leaveRequests.filter(
    (request) => request.status === "Approved",
  ).length;

  const rejected = leaveRequests.filter(
    (request) => request.status === "Rejected",
  ).length;

  const totalDaysApproved = leaveRequests
    .filter((request) => request.status === "Approved")
    .reduce((totalDays, request) => totalDays + request.days, 0);

  return delay({
    total,
    pending,
    approved,
    rejected,
    totalDaysApproved,
  });
}

export async function getLeaveBalances() {
  return delay([...leaveBalances]);
}

export async function getLeaveRequestById(requestId) {
  const request = leaveRequests.find(
    (item) => item.id === requestId,
  );

  return delay(request ?? null);
}

export async function approveLeave(requestId) {
  const requestIndex = leaveRequests.findIndex(
    (request) => request.id === requestId,
  );

  if (requestIndex === -1) {
    throw new Error("Leave request not found");
  }

  const request = leaveRequests[requestIndex];

  if (request.status !== "Pending") {
    throw new Error(
      "Only pending leave requests can be approved",
    );
  }

  const policy = await validateLeaveRequest(request);

  const balanceKey =
    leaveTypeToBalanceKey[request.leaveType];

  if (balanceKey) {
    const balanceIndex = leaveBalances.findIndex(
      (employee) =>
        employee.employeeId === request.employeeId,
    );

    if (balanceIndex === -1) {
      throw new Error(
        "Leave balance not found for this employee",
      );
    }

    const balance =
      leaveBalances[balanceIndex][balanceKey];

    if (balance.remaining < request.days) {
      throw new Error(
        `Insufficient ${request.leaveType.toLowerCase()} balance`,
      );
    }

    leaveBalances[balanceIndex] = {
      ...leaveBalances[balanceIndex],
      [balanceKey]: {
        ...balance,
        used: balance.used + request.days,
        remaining: balance.remaining - request.days,
      },
    };
  }

  leaveRequests[requestIndex] = {
    ...request,
    status: "Approved",
    reviewedOn: new Date().toISOString().split("T")[0],
    reviewedBy: "Demo Admin",
    rejectionReason: null,
  };

  return delay({
    ...leaveRequests[requestIndex],
    policy: {
      id: policy.id,
      name: policy.name,
      paid: policy.paid,
      carryForward: policy.carryForward,
      maxConsecutiveDays: policy.maxConsecutiveDays,
    },
  });
}

export async function rejectLeave(requestId, rejectionReason) {
  const index = leaveRequests.findIndex(
    (request) => request.id === requestId,
  );

  if (index === -1) {
    throw new Error("Leave request not found");
  }

  if (leaveRequests[index].status !== "Pending") {
    throw new Error("Only pending leave requests can be rejected");
  }

  if (!rejectionReason?.trim()) {
    throw new Error("A rejection reason is required");
  }

  leaveRequests[index] = {
    ...leaveRequests[index],
    status: "Rejected",
    reviewedOn: new Date().toISOString().split("T")[0],
    reviewedBy: "Demo Admin",
    rejectionReason: rejectionReason.trim(),
  };

  return delay({ ...leaveRequests[index] });
}