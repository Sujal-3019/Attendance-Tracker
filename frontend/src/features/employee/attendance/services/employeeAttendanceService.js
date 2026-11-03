import { apiRequest } from "@/lib/api";

export function getMyAttendance() {
  return apiRequest("/api/v1/me/attendance");
}

export async function checkIn(requiresLocation = true) {
  if (!requiresLocation) {
    return apiRequest("/api/v1/me/attendance/check-in", {
      method: "POST",
      body: {},
    });
  }

  if (!navigator.geolocation) {
    throw new Error(
      "Location access is unavailable. Use HTTPS or localhost and allow location access in your browser settings.",
    );
  }

  const { coords } = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const message = {
          1: "Allow location access to check in from an office.",
          2: "Your location could not be determined. Try again outdoors or enable precise location.",
          3: "Location lookup timed out. Please try again.",
        }[error.code];
        reject(new Error(message || "Unable to get your current location."));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
  });

  return apiRequest("/api/v1/me/attendance/check-in", {
    method: "POST",
    body: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    },
  });
}

export function checkOut() {
  return apiRequest("/api/v1/me/attendance/check-out", { method: "POST" });
}

async function requestReset(event, reason) {
  await apiRequest("/api/v1/me/attendance/corrections", {
    method: "POST",
    body: { event, reason },
  });
  return getMyAttendance();
}

export function resetCheckIn() {
  return requestReset("check_in", "Employee requested check-in correction.");
}

export function resetCheckOut() {
  return requestReset("check_out", "Employee requested check-out correction.");
}
