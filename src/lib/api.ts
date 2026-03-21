const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running (npm run server).");
  }

  // Guard against empty / non-JSON responses (e.g. proxy failure)
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      res.ok
        ? "Unexpected server response (not JSON)."
        : `Server error ${res.status}. Is the backend running?`
    );
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data as T;
}

export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export const authApi = {
  register: (
    name: string, email: string, password: string,
    dateOfBirth: string, gender: string,
    whyHere = "", feelingToday = "",
  ) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, dateOfBirth, gender, whyHere, feelingToday }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: AuthResponse["user"] }>("/auth/me"),
};
