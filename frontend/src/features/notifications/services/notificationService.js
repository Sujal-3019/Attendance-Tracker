const notifications = [
  {
    id: "NOT-001",
    type: "LEAVE_REQUEST",
    title: "New leave request",
    message:
      "Priya Verma submitted a Casual Leave request for October 6–7.",
    recipientId: "ADMIN-001",
    recipientName: "Demo Admin",
    priority: "Normal",
    status: "Unread",
    createdAt: "2026-10-05T15:10:00",
    actionRequired: true,
    metadata: {
      leaveRequestId: "LR-001",
      employeeId: "EMP-002",
      employeeName: "Priya Verma",
      leaveType: "Casual Leave",
    },
  },
  {
    id: "NOT-002",
    type: "FORGOT_CHECKOUT",
    title: "Employee forgot to check out",
    message:
      "Rahul Singh has not checked out after the scheduled end time of 18:00.",
    recipientId: "ADMIN-001",
    recipientName: "Demo Admin",
    priority: "High",
    status: "Unread",
    createdAt: "2026-10-05T18:15:00",
    actionRequired: true,
    metadata: {
      employeeId: "EMP-001",
      employeeName: "Rahul Singh",
      scheduledEndTime: "18:00",
      overtimeEnabled: true,
    },
  },
  {
    id: "NOT-003",
    type: "ATTENDANCE_CORRECTION",
    title: "Attendance correction requested",
    message:
      "Aarav Sharma requested a correction for his attendance record on September 30.",
    recipientId: "ADMIN-001",
    recipientName: "Demo Admin",
    priority: "Normal",
    status: "Unread",
    createdAt: "2026-10-05T13:40:00",
    actionRequired: true,
    metadata: {
      employeeId: "EMP-003",
      employeeName: "Aarav Sharma",
      attendanceDate: "2026-09-30",
    },
  },
  {
    id: "NOT-004",
    type: "ATTENDANCE_ANOMALY",
    title: "Attendance anomaly detected",
    message:
      "Suspicious location activity was detected during Ananya Gupta's attendance event.",
    recipientId: "ADMIN-001",
    recipientName: "Demo Admin",
    priority: "High",
    status: "Unread",
    createdAt: "2026-10-05T11:20:00",
    actionRequired: true,
    metadata: {
      employeeId: "EMP-007",
      employeeName: "Ananya Gupta",
      anomalyType: "Suspicious location",
    },
  },
  {
    id: "NOT-005",
    type: "LATE_ATTENDANCE",
    title: "Late attendance recorded",
    message:
      "Neha Kapoor arrived 18 minutes after the configured work start time.",
    recipientId: "ADMIN-001",
    recipientName: "Demo Admin",
    priority: "Normal",
    status: "Read",
    createdAt: "2026-10-05T09:25:00",
    actionRequired: false,
    metadata: {
      employeeId: "EMP-004",
      employeeName: "Neha Kapoor",
      lateMinutes: 18,
    },
  },
  {
    id: "NOT-006",
    type: "OVERTIME_REVIEW",
    title: "Overtime requires review",
    message:
      "3 employees recorded overtime that may require payroll review.",
    recipientId: "ADMIN-001",
    recipientName: "Demo Admin",
    priority: "Normal",
    status: "Unread",
    createdAt: "2026-10-04T19:10:00",
    actionRequired: true,
    metadata: {
      employeeCount: 3,
      overtimeHours: 14,
    },
  },
  {
    id: "NOT-007",
    type: "EMPLOYEE_ADDED",
    title: "New employee added",
    message:
      "Rohan Mehta was added to the organization and is ready for attendance setup.",
    recipientId: "ADMIN-001",
    recipientName: "Demo Admin",
    priority: "Normal",
    status: "Read",
    createdAt: "2026-10-04T16:30:00",
    actionRequired: false,
    metadata: {
      employeeId: "EMP-008",
      employeeName: "Rohan Mehta",
    },
  },
];

function delay(data, milliseconds = 250) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), milliseconds);
  });
}

export async function getNotifications() {
  return delay([...notifications]);
}

export async function getUnreadNotificationCount() {
  const unreadCount = notifications.filter(
    (notification) => notification.status === "Unread",
  ).length;

  return delay(unreadCount);
}

export async function markNotificationAsRead(notificationId) {
  const notification = notifications.find(
    (item) => item.id === notificationId,
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  notification.status = "Read";

  return delay({ ...notification });
}

export async function markAllNotificationsAsRead() {
  notifications.forEach((notification) => {
    notification.status = "Read";
  });

  return delay({ success: true });
}