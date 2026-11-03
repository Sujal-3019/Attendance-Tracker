import { apiRequest } from "@/lib/api";

export async function getAttendanceSummary(params = {}) {
  const query = new URLSearchParams(params);
  const suffix = query.size ? `?${query}` : "";
  return apiRequest(`/api/v1/attendance/summary${suffix}`);
}

export async function getAttendanceRecords(params = {}) {
  const query = new URLSearchParams({ page: "1", page_size: "100", ...params });
  const result = await apiRequest(`/api/v1/attendance?${query}`);
  return result.items;
}

export async function getEmployeeAttendanceHistory(employeeId) {
  const records = [];
  let page = 1;
  let total = 0;

  do {
    const query = new URLSearchParams({
      employee_id: employeeId,
      page: String(page),
      page_size: "100",
    });
    const result = await apiRequest(`/api/v1/attendance?${query}`);
    records.push(...result.items);
    total = result.total;
    page += 1;
  } while (records.length < total);

  return records;
}
