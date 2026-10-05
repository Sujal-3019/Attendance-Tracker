const payrollEmployees = [
  {
    employeeId: "EMP-001",
    employeeCode: "ATTENDLY01",
    name: "Rahul Singh",
    department: "Engineering",
    wageModel: "Monthly",
    baseWage: 45000,
    workingDays: 23,
    daysWorked: 21.5,
    paidLeaveDays: 1,
    unpaidLeaveDays: 0,
    lateMinutes: 42,
    overtimeHours: 6,
    lateDeduction: 525,
    absenceDeduction: 0,
    unpaidLeaveDeduction: 0,
    overtimePay: 1875,
  },
  {
    employeeId: "EMP-002",
    employeeCode: "ATTENDLY02",
    name: "Priya Verma",
    department: "Design",
    wageModel: "Monthly",
    baseWage: 38000,
    workingDays: 23,
    daysWorked: 20,
    paidLeaveDays: 2,
    unpaidLeaveDays: 0,
    lateMinutes: 38,
    overtimeHours: 3,
    lateDeduction: 380,
    absenceDeduction: 0,
    unpaidLeaveDeduction: 0,
    overtimePay: 1005,
  },
  {
    employeeId: "EMP-003",
    employeeCode: "ATTENDLY03",
    name: "Aarav Sharma",
    department: "Operations",
    wageModel: "Monthly",
    baseWage: 32000,
    workingDays: 23,
    daysWorked: 18,
    paidLeaveDays: 1,
    unpaidLeaveDays: 2,
    lateMinutes: 65,
    overtimeHours: 0,
    lateDeduction: 810,
    absenceDeduction: 0,
    unpaidLeaveDeduction: 2783,
    overtimePay: 0,
  },
  {
    employeeId: "EMP-004",
    employeeCode: "ATTENDLY04",
    name: "Neha Kapoor",
    department: "Marketing",
    wageModel: "Monthly",
    baseWage: 42000,
    workingDays: 23,
    daysWorked: 22,
    paidLeaveDays: 1,
    unpaidLeaveDays: 0,
    lateMinutes: 18,
    overtimeHours: 4,
    lateDeduction: 225,
    absenceDeduction: 0,
    unpaidLeaveDeduction: 0,
    overtimePay: 1400,
  },
  {
    employeeId: "EMP-005",
    employeeCode: "ATTENDLY05",
    name: "Vikram Patel",
    department: "Engineering",
    wageModel: "Daily",
    baseWage: 1800,
    workingDays: 23,
    daysWorked: 20,
    paidLeaveDays: 1,
    unpaidLeaveDays: 2,
    lateMinutes: 35,
    overtimeHours: 5,
    lateDeduction: 450,
    absenceDeduction: 0,
    unpaidLeaveDeduction: 3600,
    overtimePay: 2250,
  },
  {
    employeeId: "EMP-006",
    employeeCode: "ATTENDLY06",
    name: "Kavya Nair",
    department: "HR",
    wageModel: "Monthly",
    baseWage: 40000,
    workingDays: 23,
    daysWorked: 23,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    lateMinutes: 12,
    overtimeHours: 2,
    lateDeduction: 150,
    absenceDeduction: 0,
    unpaidLeaveDeduction: 0,
    overtimePay: 700,
  },
  {
    employeeId: "EMP-007",
    employeeCode: "ATTENDLY07",
    name: "Ananya Gupta",
    department: "Finance",
    wageModel: "Monthly",
    baseWage: 48000,
    workingDays: 23,
    daysWorked: 19,
    paidLeaveDays: 3,
    unpaidLeaveDays: 1,
    lateMinutes: 27,
    overtimeHours: 2,
    lateDeduction: 338,
    absenceDeduction: 0,
    unpaidLeaveDeduction: 2087,
    overtimePay: 800,
  },
  {
    employeeId: "EMP-008",
    employeeCode: "ATTENDLY08",
    name: "Rohan Mehta",
    department: "Sales",
    wageModel: "Hourly",
    baseWage: 250,
    workingDays: 23,
    daysWorked: 21,
    paidLeaveDays: 1,
    unpaidLeaveDays: 1,
    lateMinutes: 51,
    overtimeHours: 8,
    lateDeduction: 425,
    absenceDeduction: 0,
    unpaidLeaveDeduction: 2000,
    overtimePay: 3000,
  },
];

function delay(data, milliseconds = 100) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), milliseconds);
  });
}

function calculatePayroll(employee) {
  let baseEarnings = employee.baseWage;

  if (employee.wageModel === "Daily") {
    baseEarnings = employee.baseWage * employee.daysWorked;
  }

  if (employee.wageModel === "Hourly") {
    const standardHoursPerDay = 8;

    baseEarnings =
      employee.baseWage *
      employee.daysWorked *
      standardHoursPerDay;
  }

  const grossEarnings =
    baseEarnings + employee.overtimePay;

  const totalDeductions =
    employee.lateDeduction +
    employee.absenceDeduction +
    employee.unpaidLeaveDeduction;

  const netPay =
    grossEarnings - totalDeductions;

  return {
    ...employee,
    baseEarnings,
    grossEarnings,
    totalDeductions,
    netPay,
  };
}

export async function getPayrollEmployees() {
  const payroll = payrollEmployees.map(calculatePayroll);

  return delay(payroll);
}

export async function getEmployeePayroll(employeeId) {
  const employee = payrollEmployees.find(
    (item) => item.employeeId === employeeId,
  );

  if (!employee) {
    throw new Error("Employee payroll record not found");
  }

  return delay(calculatePayroll(employee));
}

export async function getPayrollSummary() {
  const payroll = payrollEmployees.map(calculatePayroll);

  const summary = payroll.reduce(
    (result, employee) => ({
      totalEmployees: result.totalEmployees + 1,
      totalPayroll: result.totalPayroll + employee.netPay,
      totalGross: result.totalGross + employee.grossEarnings,
      totalOvertime: result.totalOvertime + employee.overtimePay,
      totalDeductions:
        result.totalDeductions + employee.totalDeductions,
    }),
    {
      totalEmployees: 0,
      totalPayroll: 0,
      totalGross: 0,
      totalOvertime: 0,
      totalDeductions: 0,
    },
  );

  return delay(summary);
}