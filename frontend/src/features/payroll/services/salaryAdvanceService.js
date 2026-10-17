
const wait = (ms = 150) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const clone = (value) => structuredClone(value);

const salaryAdvances = [
    {
        id: "ADV-001",
        employeeId: "EMP-001",
        employeeCode: "ATTENDLY01",
        employeeName: "Rahul Singh",
        department: "Engineering",
        originalAmount: 20000,
        directRepayments: 2000,
        payrollRepayments: 0,
        monthlyDeduction: 2000,
        startMonth: "2026-10",
        status: "Active",
        reason: "Personal emergency",
        createdAt: "2026-09-15",
        repayments: [
            {
                id: "REP-001",
                date: "2026-09-20",
                amount: 2000,
                method: "Direct repayment",
                note: "Partial repayment received",
            },
            {
                id: "REP-002",
                date: "2026-10-01",
                amount: 2000,
                method: "Payroll deduction",
                note: "October salary",
            },
            {
                id: "REP-003",
                date: "2026-10-01",
                amount: 2000,
                method: "Payroll deduction",
                note: "October salary adjustment",
            },
        ],
    },
];

// Prevent the same employee's payroll month from
// settling advance deductions more than once.
const payrollSettlements = new Map();

function getOutstandingBalance(advance) {
    return Math.max(
        0,
        advance.originalAmount -
        advance.directRepayments -
        advance.payrollRepayments,
    );
}

function enrichAdvance(advance) {
    const outstandingBalance = getOutstandingBalance(advance);

    return {
        ...advance,
        outstandingBalance,
        totalRepaid:
            advance.directRepayments + advance.payrollRepayments,
        status:
            outstandingBalance === 0
                ? "Repaid"
                : advance.status === "Cancelled"
                    ? "Cancelled"
                    : "Active",
    };
}

function validatePositiveAmount(amount, label = "Amount") {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`${label} must be greater than zero.`);
    }
}

export async function getSalaryAdvances() {
    await wait();
    return clone(salaryAdvances.map(enrichAdvance));
}

export async function getEmployeeSalaryAdvances(employeeId) {
    await wait();

    return clone(
        salaryAdvances
            .filter((advance) => advance.employeeId === employeeId)
            .map(enrichAdvance),
    );
}

export async function createSalaryAdvance(payload) {
    await wait();

    const {
        employeeId,
        employeeCode,
        employeeName,
        department,
        originalAmount,
        monthlyDeduction,
        startMonth,
        reason,
    } = payload;

    validatePositiveAmount(originalAmount, "Advance amount");
    validatePositiveAmount(monthlyDeduction, "Monthly deduction");

    if (monthlyDeduction > originalAmount) {
        throw new Error(
            "Monthly deduction cannot exceed the original advance amount.",
        );
    }

    if (!employeeId || !employeeName || !startMonth) {
        throw new Error("Employee and first deduction month are required.");
    }

    if (!reason?.trim()) {
        throw new Error("Please provide a reason for the advance.");
    }

    const advance = {
        id: `ADV-${String(salaryAdvances.length + 1).padStart(3, "0")}`,
        employeeId,
        employeeCode,
        employeeName,
        department,
        originalAmount,
        directRepayments: 0,
        payrollRepayments: 0,
        monthlyDeduction,
        startMonth,
        status: "Active",
        reason: reason.trim(),
        createdAt: new Date().toISOString().slice(0, 10),
        repayments: [],
    };

    salaryAdvances.unshift(advance);

    return clone(enrichAdvance(advance));
}

export async function recordAdvanceRepayment(advanceId, payload) {
    await wait();

    const advance = salaryAdvances.find(
        (item) => item.id === advanceId,
    );

    if (!advance) {
        throw new Error("Salary advance not found.");
    }

    const { amount, date, method, note = "" } = payload;

    validatePositiveAmount(amount, "Repayment amount");

    if (!["Direct repayment", "Payroll deduction"].includes(method)) {
        throw new Error("Please select a valid repayment method.");
    }

    const outstandingBalance = getOutstandingBalance(advance);

    if (amount > outstandingBalance) {
        throw new Error(
            `Repayment cannot exceed the outstanding balance of ₹${outstandingBalance}.`,
        );
    }

    if (method === "Direct repayment") {
        advance.directRepayments += amount;
    } else {
        advance.payrollRepayments += amount;
    }

    advance.repayments.push({
        id: `REP-${Date.now()}`,
        date: date || new Date().toISOString().slice(0, 10),
        amount,
        method,
        note: note.trim(),
    });

    if (getOutstandingBalance(advance) === 0) {
        advance.status = "Repaid";
    }

    return clone(enrichAdvance(advance));
}

export async function settleSalaryAdvance(advanceId) {
    await wait();

    const advance = salaryAdvances.find(
        (item) => item.id === advanceId,
    );

    if (!advance) {
        throw new Error("Salary advance not found.");
    }

    const outstandingBalance = getOutstandingBalance(advance);

    if (outstandingBalance <= 0) {
        throw new Error("This salary advance is already settled.");
    }

    const today = new Date().toISOString().slice(0, 10);

    // Record the remaining amount as a direct repayment.
    advance.directRepayments += outstandingBalance;

    advance.repayments.push({
        id: `REP-${Date.now()}`,
        date: today,
        amount: outstandingBalance,
        method: "Manual settlement",
        note: "Remaining balance settled early by admin.",
    });

    advance.status = "Repaid";

    return clone(enrichAdvance(advance));
}

export async function updateAdvanceRepaymentRule(
    advanceId,
    payload,
) {
    await wait();

    const advance = salaryAdvances.find(
        (item) => item.id === advanceId,
    );

    if (!advance) {
        throw new Error("Salary advance not found.");
    }

    const { monthlyDeduction, startMonth } = payload;

    validatePositiveAmount(monthlyDeduction, "Monthly deduction");

    const outstandingBalance = getOutstandingBalance(advance);

    if (monthlyDeduction > outstandingBalance && outstandingBalance > 0) {
        throw new Error(
            "Monthly deduction cannot exceed the outstanding balance.",
        );
    }

    if (!startMonth) {
        throw new Error("First deduction month is required.");
    }

    advance.monthlyDeduction = monthlyDeduction;
    advance.startMonth = startMonth;

    return clone(enrichAdvance(advance));
}

export async function settlePayrollAdvanceDeductions(
    employeeId,
    payrollMonth,
    date,
) {
    const settlementKey = `${employeeId}:${payrollMonth}`;

    // Return the original settlement if already processed.
    if (payrollSettlements.has(settlementKey)) {
        return clone(payrollSettlements.get(settlementKey));
    }

    await wait();

    // Check again after the async wait.
    if (payrollSettlements.has(settlementKey)) {
        return clone(payrollSettlements.get(settlementKey));
    }

    const eligibleAdvances = salaryAdvances.filter(
        (advance) =>
            advance.employeeId === employeeId &&
            advance.status === "Active" &&
            advance.startMonth <= payrollMonth &&
            getOutstandingBalance(advance) > 0,
    );

    const deductions = eligibleAdvances.map((advance) => ({
        advance,
        amount: Math.min(
            advance.monthlyDeduction,
            getOutstandingBalance(advance),
        ),
    }));

    const settledAt = date || new Date().toISOString().slice(0, 10);

    // Record each deduction exactly once for this payroll month.
    const settlements = deductions
        .filter(({ amount }) => amount > 0)
        .map(({ advance, amount }) => {
            advance.payrollRepayments += amount;

            advance.repayments.push({
                id: `REP-${crypto.randomUUID()}`,
                date: settledAt,
                amount,
                method: "Payroll deduction",
                note: `Payroll deduction for ${payrollMonth}`,
            });

            if (getOutstandingBalance(advance) === 0) {
                advance.status = "Repaid";
            }

            return {
                advanceId: advance.id,
                employeeId,
                payrollMonth,
                amount,
            };
        });

    payrollSettlements.set(settlementKey, settlements);

    return clone(settlements);
}