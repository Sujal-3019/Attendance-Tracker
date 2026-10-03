const attendanceSummary = {
  present: 24,
  late: 3,
  onLeave: 2,
  absent: 3,
};

const attendanceRecords = [
  {
    id: 1,
    employee: "Aarav Sharma",
    initials: "AS",
    department: "Engineering",
    date: "01 Oct 2026",
    checkIn: "08:57 AM",
    checkOut: "06:02 PM",
    hours: "9h 05m",
    location: "Office verified",
    status: "Present",
  },
  {
    id: 2,
    employee: "Priya Verma",
    initials: "PV",
    department: "Operations",
    date: "01 Oct 2026",
    checkIn: "09:04 AM",
    checkOut: "06:11 PM",
    hours: "9h 07m",
    location: "Office verified",
    status: "Late",
  },
  {
    id: 3,
    employee: "Rahul Singh",
    initials: "RS",
    department: "Sales",
    date: "01 Oct 2026",
    checkIn: "08:52 AM",
    checkOut: "05:58 PM",
    hours: "9h 06m",
    location: "Office verified",
    status: "Present",
  },
  {
    id: 4,
    employee: "Ananya Gupta",
    initials: "AG",
    department: "HR",
    date: "01 Oct 2026",
    checkIn: "09:21 AM",
    checkOut: "—",
    hours: "6h 34m",
    location: "Office verified",
    status: "Late",
  },
  {
    id: 5,
    employee: "Vikram Patel",
    initials: "VP",
    department: "Finance",
    date: "01 Oct 2026",
    checkIn: "08:59 AM",
    checkOut: "06:03 PM",
    hours: "9h 04m",
    location: "Office verified",
    status: "Present",
  },
  {
    id: 6,
    employee: "Neha Kapoor",
    initials: "NK",
    department: "Marketing",
    date: "01 Oct 2026",
    checkIn: "—",
    checkOut: "—",
    hours: "—",
    location: "—",
    status: "On Leave",
  },
  {
    id: 7,
    employee: "Rohan Mehta",
    initials: "RM",
    department: "Engineering",
    date: "01 Oct 2026",
    checkIn: "—",
    checkOut: "—",
    hours: "—",
    location: "—",
    status: "Absent",
  },
];

export async function getAttendanceSummary() {
  await new Promise((resolve) => {
    setTimeout(resolve, 350);
  });

  return attendanceSummary;
}

export async function getAttendanceRecords() {
  await new Promise((resolve) => {
    setTimeout(resolve, 350);
  });

  return attendanceRecords;
}