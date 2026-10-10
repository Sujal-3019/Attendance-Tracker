
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const { body, headers: customHeaders, ...fetchOptions } = options;
  const headers = new Headers(customHeaders);

  let requestBody = body;

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    typeof body !== "string"
  ) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  if (body instanceof FormData) {
    headers.delete("Content-Type");
  }

  headers.set("Accept", "application/json");

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${normalizedPath}`,
      {
        ...fetchOptions,
        headers,
        body: requestBody,
      },
    );
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Unable to connect to the server. Please try again.",
    );
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError("The request failed.", {
        status: response.status,
      });
    }

    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text || null;
    }
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail =
      typeof data === "string"
        ? data
        : data?.detail || data?.message || data?.error;

    const message =
      typeof detail === "string"
        ? detail
        : `Request failed with status ${response.status}.`;

    throw new ApiError(message, {
      status: response.status,
      data,
    });
  }

  return data;
}
