export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
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

    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");

      window.location.href = "/login";
    }

    throw new Error("Unauthorized");
  }
  return response;
};

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
