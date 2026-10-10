
import { apiRequest } from "@/lib/api";

export async function checkApiHealth() {
  try {
    const data = await apiRequest("/health", {
      method: "GET",
    });

    return {
      connected: true,
      data,
      error: null,
    };
  } catch (error) {
    return {
      connected: false,
      data: null,
      error: error.message || "API is unavailable.",
    };
  }
}
