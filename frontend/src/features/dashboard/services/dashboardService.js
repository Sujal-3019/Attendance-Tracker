const dashboardStats = {
  totalEmployees: 32,
  presentToday: 24,
  lateToday: 3,
  onLeaveToday: 2,
};

const recentAttendance = [
  {
    id: 1,
    employee: "Aarav Sharma",
    initials: "AS",
    department: "Engineering",
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
    checkIn: "08:59 AM",
    checkOut: "06:03 PM",
    hours: "9h 04m",
    location: "Office verified",
    status: "Present",
  },
];

export async function getDashboardStats() {
  await new Promise((resolve) => {
    setTimeout(resolve, 400);
  });

  return dashboardStats;
}

export async function getRecentAttendance() {
  await new Promise((resolve) => {
    setTimeout(resolve, 400);
  });

  return recentAttendance;
}