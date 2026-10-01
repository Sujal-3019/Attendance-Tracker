export async function registerAdmin(payload) {
  // Temporary mock implementation.
  // This function will later call the FastAPI endpoint.

  await new Promise((resolve) => {
    setTimeout(resolve, 800);
  });

  return {
    success: true,
    user: {
      id: "mock-admin-001",
      name: payload.fullName,
      email: payload.email,
      role: "admin",
    },
    organization: {
      id: "mock-org-001",
      name: payload.organizationName,
      type: payload.organizationType,
    },
  };
}


export async function loginUser(payload) {
  // Temporary mock implementation.
  // This will later call the FastAPI authentication endpoint.

  await new Promise((resolve) => {
    setTimeout(resolve, 800);
  });

  // Temporary demo credentials.
  if (
    payload.email !== "admin@a.com" ||
    payload.password !== "password123"
  ) {
    throw new Error("Invalid email or password.");
  }

  return {
    success: true,
    user: {
      id: "mock-admin-001",
      name: "Demo Admin",
      email: payload.email,
      role: "admin",
      organizationId: "mock-org-001",
    },
  };
}

export async function registerEmployee(payload) {
  // Temporary mock implementation.
  // Later this will call the FastAPI employee registration endpoint.

  await new Promise((resolve) => {
    setTimeout(resolve, 800);
  });

  if (payload.organizationCode.toUpperCase() !== "ATTENDLY01") {
    throw new Error("Invalid organization code.");
  }

  return {
    success: true,
    user: {
      id: "mock-employee-001",
      name: payload.fullName,
      email: payload.email,
      role: "employee",
      organizationId: "mock-org-001",
    },
    organization: {
      id: "mock-org-001",
      name: "Attendly Demo Organization",
    },
  };
}
