
const wait = (ms = 250) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function makePastRecord(daysAgo, checkInTime, checkOutTime) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  const dateKey = getLocalDateKey(date);

  return {
    id: `mock-attendance-${dateKey}`,
    date: dateKey,
    checkIn: `${dateKey}T${checkInTime}:00`,
    checkOut: `${dateKey}T${checkOutTime}:00`,
    status: "Present",
  };
}

let todayRecord = null;

let attendanceHistory = [
  makePastRecord(1, "09:12", "18:04"),
  makePastRecord(2, "09:03", "18:11"),
  makePastRecord(3, "09:24", "18:02"),
  makePastRecord(4, "08:56", "18:16"),
  makePastRecord(5, "09:08", "17:58"),
];

function clone(value) {
  return structuredClone(value);
}

export async function getMyAttendance() {
  await wait();

  const today = getLocalDateKey();

  // Do not show a previous day's record as today's attendance.
  if (todayRecord && todayRecord.date !== today) {
    todayRecord = null;
  }

  const history = todayRecord
    ? [todayRecord, ...attendanceHistory]
    : attendanceHistory;

  return {
    today: clone(todayRecord),
    history: clone(history),
  };
}

export async function checkIn() {
  await wait();

  if (todayRecord?.checkIn) {
    throw new Error("You have already checked in today.");
  }

  const now = new Date();

  todayRecord = {
    id: `mock-attendance-${getLocalDateKey(now)}`,
    date: getLocalDateKey(now),
    checkIn: now.toISOString(),
    checkOut: null,
    status: "Present",
  };

  return clone(todayRecord);
}

export async function checkOut() {
  await wait();

  if (!todayRecord?.checkIn) {
    throw new Error("You must check in before checking out.");
  }

  if (todayRecord.checkOut) {
    throw new Error("You have already checked out today.");
  }

  todayRecord = {
    ...todayRecord,
    checkOut: new Date().toISOString(),
  };

  return clone(todayRecord);
}
