const wait = (ms = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let profile = {
  employeeId: "EMP-003",
  fullName: "Rahul Singh",
  email: "employee@a.com",
  phone: "",
  department: "Operations",
  designation: "Employee",
  employmentType: "Full-time",
  joiningDate: "2026-01-15",
  workMode: "Office",
  manager: "Demo Admin",
};

export async function getMyProfile() {
  await wait();
  return structuredClone(profile);
}

export async function updateMyProfile(updates) {
  await wait();

  const allowedFields = ["phone"];
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      allowedFields.includes(key)
    )
  );

  profile = { ...profile, ...safeUpdates };

  return structuredClone(profile);
}