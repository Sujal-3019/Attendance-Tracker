
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
