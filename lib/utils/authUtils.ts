// TODO: Use environment variable for API base URL
export const API_BASE = "http://localhost:8000";

// Helper function to get the auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

// Wrapper for fetch that includes the Authorization header
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  // Ensure Content-Type is set for methods that have a body, if not already set
  if (options.body && !headers.has("Content-Type")) {
    // Default to JSON, but allow overrides via options.headers
    // Note: Login uses 'application/x-www-form-urlencoded', handled separately in LoginForm
    headers.append("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.error(
      "Unauthorized request - Token might be invalid or expired. Redirecting to login."
    );
    // Clear token and redirect
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      // Assuming tokenType might also be stored, uncomment if needed
      // localStorage.removeItem("tokenType");
      window.location.href = "/login"; // Force redirect
    }
    // Throw an error to stop further processing in the calling function
    throw new Error("Unauthorized");
  }
  return response;
};

// Helper function to handle fetch responses (now uses fetchWithAuth implicitly via callers)
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Failed to parse error response" }));
    console.error("API Error:", response.status, errorData);
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }
  return response.json() as Promise<T>;
}
