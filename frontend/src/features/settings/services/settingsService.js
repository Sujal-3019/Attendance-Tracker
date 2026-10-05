const organizationSettings = {
    organizationName: "Attendly Technologies",
    organizationEmail: "admin@attendly.demo",
    phone: "+91 98765 43210",
    address: "Noida, Uttar Pradesh, India",
    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
};

function delay(data, milliseconds = 100) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(data), milliseconds);
    });
}

export async function getOrganizationSettings() {
    return delay({ ...organizationSettings });
}

export async function updateOrganizationSettings(settings) {
    Object.assign(organizationSettings, settings);

    return delay({
        ...organizationSettings,
    });
}


const attendancePolicy = {
    workStartTime: "09:00",
    workEndTime: "18:00",
    gracePeriodMinutes: 15,
    lateThresholdMinutes: 30,
    minimumWorkingHours: 8,
    halfDayHours: 4,
    earlyCheckoutAllowed: true,
    overtimeEnabled: true,
    overtimeAfterMinutes: 30,
    workingDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
    ],
};
export async function getAttendancePolicy() {
    return delay({
        ...attendancePolicy,
        workingDays: [...attendancePolicy.workingDays],
    });
}

export async function updateAttendancePolicy(policy) {
    Object.assign(attendancePolicy, {
        ...policy,
        workingDays: [...policy.workingDays],
    });

    return delay({
        ...attendancePolicy,
        workingDays: [...attendancePolicy.workingDays],
    });
}

const workLocations = [
    {
        id: "LOC-001",
        name: "Main Office",
        address: "Noida, Uttar Pradesh, India",
        latitude: 28.5355,
        longitude: 77.391,
        radiusMeters: 150,
        primary: true,
        status: "Active",
    },
    {
        id: "LOC-002",
        name: "Delhi Branch",
        address: "New Delhi, Delhi, India",
        latitude: 28.6139,
        longitude: 77.209,
        radiusMeters: 200,
        primary: false,
        status: "Active",
    },
];

export async function getWorkLocations() {
    return delay(
        workLocations.map((location) => ({
            ...location,
        })),
    );
}

export async function createWorkLocation(locationData) {
    const newLocation = {
        ...locationData,
        id: `LOC-${String(workLocations.length + 1).padStart(3, "0")}`,
        status: "Active",
    };

    if (newLocation.primary) {
        workLocations.forEach((location) => {
            location.primary = false;
        });
    }

    workLocations.push(newLocation);

    return delay({
        ...newLocation,
    });
}

export async function updateWorkLocation(
    locationId,
    locationData,
) {
    const index = workLocations.findIndex(
        (location) => location.id === locationId,
    );

    if (index === -1) {
        throw new Error("Work location not found");
    }

    if (locationData.primary) {
        workLocations.forEach((location) => {
            location.primary = false;
        });
    }

    workLocations[index] = {
        ...workLocations[index],
        ...locationData,
        id: locationId,
    };

    return delay({
        ...workLocations[index],
    });
}

export async function updateWorkLocationStatus(
    locationId,
    status,
) {
    const index = workLocations.findIndex(
        (location) => location.id === locationId,
    );

    if (index === -1) {
        throw new Error("Work location not found");
    }

    if (!["Active", "Inactive"].includes(status)) {
        throw new Error("Invalid location status");
    }

    workLocations[index] = {
        ...workLocations[index],
        status,
    };

    return delay({
        ...workLocations[index],
    });
}

const payrollSettings = {
    wageModel: "Monthly",
    defaultWage: 45000,

    lateDeductionEnabled: true,
    lateDeductionType: "Per Minute",
    lateDeductionRate: 25,

    halfDayDeductionEnabled: true,
    halfDayDeductionType: "Half Day Wage",
    halfDayDeductionAmount: 0,

    
    absenceDeductionEnabled: true,
    absenceDeductionType: "Full Day Wage",
    absenceDeductionAmount: 0,

    overtimeEnabled: true,
    overtimeMultiplier: 1.5,

    paidLeaveDeduction: false,
    unpaidLeaveDeduction: true,
};

export async function getPayrollSettings() {
    return delay({ ...payrollSettings });
}

export async function updatePayrollSettings(settings) {
    Object.assign(payrollSettings, settings);

    return delay({ ...payrollSettings });
}