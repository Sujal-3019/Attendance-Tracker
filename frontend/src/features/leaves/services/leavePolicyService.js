const leavePolicies = [
    {
        id: "LP-001",
        name: "Casual Leave",
        code: "CL",
        description: "For personal and short-term planned requirements.",
        annualAllocation: 12,
        paid: true,
        carryForward: false,
        maxConsecutiveDays: 3,
        status: "Active",
    },
    {
        id: "LP-002",
        name: "Sick Leave",
        code: "SL",
        description: "Leave for illness, medical needs, or recovery.",
        annualAllocation: 6,
        paid: true,
        carryForward: false,
        maxConsecutiveDays: 5,
        status: "Active",
    },
    {
        id: "LP-003",
        name: "Earned Leave",
        code: "EL",
        description: "Planned paid leave accumulated by employees.",
        annualAllocation: 15,
        paid: true,
        carryForward: true,
        maxConsecutiveDays: 15,
        status: "Active",
    },
    {
        id: "LP-004",
        name: "Unpaid Leave",
        code: "UL",
        description: "Leave without salary deduction protection.",
        annualAllocation: 0,
        paid: false,
        carryForward: false,
        maxConsecutiveDays: 30,
        status: "Active",
    },
];

function delay(data, milliseconds = 300) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(data), milliseconds);
    });
}

export async function getLeavePolicies() {
    return delay([...leavePolicies]);
}

export async function getLeavePolicyById(policyId) {
    const policy = leavePolicies.find(
        (item) => item.id === policyId,
    );

    return delay(policy ?? null);
}

export async function createLeavePolicy(policyData) {
    const newPolicy = {
        ...policyData,
        id: `LP-${String(leavePolicies.length + 1).padStart(3, "0")}`,
        status: "Active",
    };

    leavePolicies.push(newPolicy);

    return delay({ ...newPolicy });
}

export async function updateLeavePolicy(policyId, policyData) {
    const index = leavePolicies.findIndex(
        (policy) => policy.id === policyId,
    );

    if (index === -1) {
        throw new Error("Leave policy not found");
    }

    leavePolicies[index] = {
        ...leavePolicies[index],
        ...policyData,
        id: policyId,
    };

    return delay({ ...leavePolicies[index] });
}

export async function updateLeavePolicyStatus(policyId, status) {
    const index = leavePolicies.findIndex(
        (policy) => policy.id === policyId,
    );

    if (index === -1) {
        throw new Error("Leave policy not found");
    }

    if (!["Active", "Inactive"].includes(status)) {
        throw new Error("Invalid policy status");
    }

    leavePolicies[index] = {
        ...leavePolicies[index],
        status,
    };

    return delay({ ...leavePolicies[index] });
}