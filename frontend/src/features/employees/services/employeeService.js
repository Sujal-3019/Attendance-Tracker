const employees = [
  {
    id: "EMP-001",
    name: "Aarav Sharma",
    email: "aarav.sharma@attendly.demo",
    phone: "+91 98765 43210",
    department: "Engineering",
    designation: "Software Engineer",
    employmentType: "Full-time",
    workMode: "Office",
    location: "Head Office",
    joiningDate: "2025-07-14",
    status: "Active",
    attendance: {
      present: 21,
      late: 2,
      absent: 1,
      leave: 1,
    },
  },
  {
    id: "EMP-002",
    name: "Priya Verma",
    email: "priya.verma@attendly.demo",
    phone: "+91 98765 43211",
    department: "Human Resources",
    designation: "HR Executive",
    employmentType: "Full-time",
    workMode: "Hybrid",
    location: "Head Office",
    joiningDate: "2025-08-04",
    status: "Active",
    attendance: {
      present: 20,
      late: 1,
      absent: 0,
      leave: 2,
    },
  },
  {
    id: "EMP-003",
    name: "Rahul Singh",
    email: "rahul.singh@attendly.demo",
    phone: "+91 98765 43212",
    department: "Sales",
    designation: "Sales Executive",
    employmentType: "Full-time",
    workMode: "Office",
    location: "Head Office",
    joiningDate: "2025-06-21",
    status: "Active",
    attendance: {
      present: 19,
      late: 3,
      absent: 2,
      leave: 1,
    },
  },
  {
    id: "EMP-004",
    name: "Ananya Gupta",
    email: "ananya.gupta@attendly.demo",
    phone: "+91 98765 43213",
    department: "Finance",
    designation: "Accountant",
    employmentType: "Full-time",
    workMode: "Office",
    location: "Head Office",
    joiningDate: "2024-11-18",
    status: "Active",
    attendance: {
      present: 22,
      late: 0,
      absent: 0,
      leave: 1,
    },
  },
  {
    id: "EMP-005",
    name: "Vikram Patel",
    email: "vikram.patel@attendly.demo",
    phone: "+91 98765 43214",
    department: "Operations",
    designation: "Operations Executive",
    employmentType: "Full-time",
    workMode: "Office",
    location: "Head Office",
    joiningDate: "2025-01-13",
    status: "Active",
    attendance: {
      present: 18,
      late: 4,
      absent: 2,
      leave: 2,
    },
  },
  {
    id: "EMP-006",
    name: "Neha Kapoor",
    email: "neha.kapoor@attendly.demo",
    phone: "+91 98765 43215",
    department: "Design",
    designation: "UI/UX Designer",
    employmentType: "Full-time",
    workMode: "Remote",
    location: "Remote",
    joiningDate: "2025-09-01",
    status: "Active",
    attendance: {
      present: 20,
      late: 1,
      absent: 1,
      leave: 1,
    },
  },
  {
    id: "EMP-007",
    name: "Rohan Mehta",
    email: "rohan.mehta@attendly.demo",
    phone: "+91 98765 43216",
    department: "Engineering",
    designation: "Frontend Developer",
    employmentType: "Full-time",
    workMode: "Hybrid",
    location: "Head Office",
    joiningDate: "2024-08-26",
    status: "Inactive",
    attendance: {
      present: 16,
      late: 2,
      absent: 3,
      leave: 2,
    },
  },
  {
    id: "EMP-008",
    name: "Kavya Nair",
    email: "kavya.nair@attendly.demo",
    phone: "+91 98765 43217",
    department: "Marketing",
    designation: "Marketing Executive",
    employmentType: "Full-time",
    workMode: "Hybrid",
    location: "Head Office",
    joiningDate: "2025-03-10",
    status: "Active",
    attendance: {
      present: 21,
      late: 1,
      absent: 0,
      leave: 1,
    },
  },
];

function delay(data, milliseconds = 300) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), milliseconds);
  });
}

export async function getEmployees() {
  return delay([...employees]);
}

export async function getEmployeeById(employeeId) {
  const employee = employees.find((item) => item.id === employeeId);

  return delay(employee ?? null);
}

export async function getEmployeeStats() {
  const total = employees.length;
  const active = employees.filter((employee) => employee.status === "Active").length;
  const inactive = employees.filter(
    (employee) => employee.status === "Inactive",
  ).length;

  // Mock value for now.
  // This will eventually come from the attendance/leave backend.
  const onLeave = 2;

  return delay({
    total,
    active,
    inactive,
    onLeave,
  });
}

export async function getEmployeeDetails(employeeId) {
  const employee = employees.find((item) => item.id === employeeId);

  if (!employee) {
    return delay(null);
  }

  const details = {
    ...employee,

    manager: "Demo Admin",

    recentAttendance: [
      {
        date: "2026-10-03",
        checkIn: "08:54 AM",
        checkOut: "06:02 PM",
        workHours: "9h 08m",
        status: "Present",
      },
      {
        date: "2026-10-02",
        checkIn: "09:18 AM",
        checkOut: "06:04 PM",
        workHours: "8h 46m",
        status: "Late",
      },
      {
        date: "2026-10-01",
        checkIn: "08:57 AM",
        checkOut: "06:01 PM",
        workHours: "9h 04m",
        status: "Present",
      },
      {
        date: "2026-09-30",
        checkIn: "—",
        checkOut: "—",
        workHours: "—",
        status: "On Leave",
      },
      {
        date: "2026-09-29",
        checkIn: "08:59 AM",
        checkOut: "06:00 PM",
        workHours: "9h 01m",
        status: "Present",
      },
    ],

    leaveSummary: {
      casual: {
        allocated: 12,
        used: 3,
        remaining: 9,
      },
      sick: {
        allocated: 6,
        used: 1,
        remaining: 5,
      },
      earned: {
        allocated: 15,
        used: 2,
        remaining: 13,
      },
    },
  };

  return delay(details);
}