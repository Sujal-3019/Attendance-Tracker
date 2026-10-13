import { getMyAttendance } from "@/features/employee/attendance/services/employeeAttendanceService";
import { getMyLeaves } from "@/features/employee/leaves/services/employeeLeaveService";

const wait = (ms = 250) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const payrollRecords = [
  {
    id: "PAY-2026-09",
    month: "September",
    year: 2026,
    status: "Paid",
    paymentDate: "2026-10-01",
    basicSalary: 25000,
    hra: 10000,
    allowances: 5000,
    overtime: 1800,
    deductions: 2200,
  },
  {
    id: "PAY-2026-08",
    month: "August",
    year: 2026,
    status: "Paid",
    paymentDate: "2026-09-01",
    basicSalary: 25000,
    hra: 10000,
    allowances: 5000,
    overtime: 1200,
    deductions: 2200,
  },
  {
    id: "PAY-2026-07",
    month: "July",
    year: 2026,
    status: "Paid",
    paymentDate: "2026-08-01",
    basicSalary: 25000,
    hra: 10000,
    allowances: 5000,
    overtime: 900,
    deductions: 2200,
  },
  {
    id: "PAY-2026-06",
    month: "June",
    year: 2026,
    status: "Paid",
    paymentDate: "2026-07-01",
    basicSalary: 25000,
    hra: 10000,
    allowances: 5000,
    overtime: 1500,
    deductions: 2200,
  },
  {
    id: "PAY-2026-05",
    month: "May",
    year: 2026,
    status: "Paid",
    paymentDate: "2026-06-01",
    basicSalary: 25000,
    hra: 10000,
    allowances: 5000,
    overtime: 700,
    deductions: 2200,
  },
  {
    id: "PAY-2026-04",
    month: "April",
    year: 2026,
    status: "Paid",
    paymentDate: "2026-05-01",
    basicSalary: 25000,
    hra: 10000,
    allowances: 5000,
    overtime: 1100,
    deductions: 2200,
  },
];

function clone(value) {
  return structuredClone(value);
}

function calculateNetPay(record) {
  return (
    record.basicSalary +
    record.hra +
    record.allowances +
    record.overtime -
    record.deductions
  );
}

function enrichRecord(record) {
  return {
    ...record,
    grossPay:
      record.basicSalary +
      record.hra +
      record.allowances +
      record.overtime,
    netPay: calculateNetPay(record),
  };
}

export async function getMyPayroll() {
  await wait();

  const records = payrollRecords.map(enrichRecord);
  const latest = records[0] ?? null;

  return {
    employee: {
      employeeId: "EMP-003",
      department: "Operations",
      designation: "Employee",
      currency: "INR",
    },
    latest,
    records,
  };
}

export async function getMyPayslip(payslipId) {
  await wait();

  const record = payrollRecords.find((item) => item.id === payslipId);

  if (!record) {
    throw new Error("Payslip not found.");
  }

  return clone(enrichRecord(record));
}



export async function getMySalaryProjection() {
  await wait();

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  const month = now.toLocaleString("en-IN", {
    month: "long",
  });

  const monthStart = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;

  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  const monthEnd = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [attendanceData, leaveData] = await Promise.all([
    getMyAttendance(),
    getMyLeaves(),
  ]);

  // Keep historical payroll records unchanged.
  const latestRecord = payrollRecords[0];

  const earnings = {
    basicSalary: latestRecord.basicSalary,
    hra: latestRecord.hra,
    allowances: latestRecord.allowances,
    overtime: 0,
    performanceBonus: 0,
  };

  const monthlySalary =
    earnings.basicSalary + earnings.hra + earnings.allowances;

  const dailySalary = monthlySalary / lastDay;

  // Count approved, explicitly unpaid leave days overlapping this month.
  // Pending and rejected requests never reduce projected salary.
  const unpaidLeaveDays = leaveData.requests.reduce((total, request) => {
    if (request.status !== "Approved") {
      return total;
    }

    const leaveType = leaveData.balances.find(
      (balance) => balance.type === request.type
    );

    if (leaveType?.paymentType !== "Unpaid") {
      return total;
    }

    const startDate =
      request.startDate > monthStart ? request.startDate : monthStart;

    const endDate =
      request.endDate < monthEnd ? request.endDate : monthEnd;

    if (startDate > endDate) {
      return total;
    }

    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);

    const overlappingDays =
      Math.floor((end - start) / 86400000) + 1;

    return total + overlappingDays;
  }, 0);

  const deductions = {
    unpaidLeave: Math.round(dailySalary * unpaidLeaveDays),
    attendancePenalty: 0,
    otherDeductions: latestRecord.deductions,
  };

  const grossPay = Object.values(earnings).reduce(
    (total, amount) => total + amount,
    0
  );

  const totalDeductions = Object.values(deductions).reduce(
    (total, amount) => total + amount,
    0
  );

  const netPay = grossPay - totalDeductions;

  // Attendance is displayed as information only.
  // The current mock does not define official schedules or late rules.
  const monthlyAttendance = attendanceData.history.filter(
    (record) =>
      record.date >= monthStart && record.date <= monthEnd
  );

  const attendanceSummary = {
    recordedDays: monthlyAttendance.length,
    presentDays: monthlyAttendance.filter(
      (record) => record.status === "Present"
    ).length,
    completedDays: monthlyAttendance.filter(
      (record) => record.checkIn && record.checkOut
    ).length,
  };

  return {
    period: {
      month,
      year,
    },
    currency: "INR",
    status: "Estimated",
    earnings,
    deductions,
    grossPay,
    totalDeductions,
    netPay,
    calendarDays: lastDay,
    dailySalary: Number(dailySalary.toFixed(2)),
    unpaidLeaveDays,
    attendanceSummary,
    note:
      "This is an estimate. Overtime, performance incentives, and attendance penalties are not yet calculated from verified records. Other deductions currently use mock payroll data.",
  };
}
