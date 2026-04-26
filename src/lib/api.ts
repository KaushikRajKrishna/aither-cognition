const BASE = "/api";

function getToken() {
  return sessionStorage.getItem("token");
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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  contextUsed: string[];
  sessionId: string;
  metadata?: {
    emotion: {
      primary: string;
      secondary: string[];
      confidence: number;
      sentimentScore: number;
    };
    riskLevel: string;
    crisisFlags: string[];
    safetyFiltered: boolean;
    conversationPhase: string;
  };
}

export const chatApi = {
  send: (message: string, history: ChatMessage[], sessionId?: string) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, history, sessionId }),
    }),

  // Fetch chat history for a session or user
  getHistory: (userId: string, sessionId?: string, limit = 50, offset = 0) => {
    let url = `/chat-history/${userId}/history?limit=${limit}&offset=${offset}`;
    if (sessionId) url += `&sessionId=${sessionId}`;
    return request<{
      messages: any[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>(url);
  },

  // Get conversation statistics
  getStats: (userId: string) =>
    request<{
      stats: {
        totalMessages: number;
        userMessages: number;
        assistantMessages: number;
        uniqueSessions: number;
        averageEmotionScore: number;
        highestRiskCount: number;
      };
    }>(`/chat-history/${userId}/stats`),

  // Get full conversation transcript
  getTranscript: (sessionId: string, userId: string) =>
    request<{
      transcript: any[];
      summary: {
        sessionId: string;
        startedAt: string;
        endedAt: string;
        messageCount: number;
        emotions: string[];
        riskLevels: string[];
        highestRisk: string;
      };
    }>(`/chat-history/${sessionId}/transcript?userId=${userId}`),

  // Export conversation as JSON
  exportConversation: (sessionId: string, userId: string) =>
    request<any>(`/chat-history/${sessionId}/export?userId=${userId}`),

  // Admin: Get flagged high-risk messages
  getFlaggedMessages: (riskLevel = "high", limit = 50, offset = 0, resolved?: boolean) => {
    let url = `/chat-history/admin/flagged-messages?riskLevel=${riskLevel}&limit=${limit}&offset=${offset}`;
    if (resolved !== undefined) url += `&resolved=${resolved}`;
    return request<{
      flaggedMessages: any[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>(url);
  },

  // Admin: Mark message as reviewed
  markAsReviewed: (messageId: string, action: string, notes?: string) =>
    request<{ message: string; data: any }>(`/chat-history/${messageId}/review`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    }),
};

export interface DoctorAuthResponse {
  token: string;
  doctor: { id: string; name: string; email: string; role: string; expertise: string[]; hospitalName: string };
}

export interface DoctorAvailability {
  day: string;
  limit: number;
}

export interface DoctorProfile {
  _id: string;
  name: string;
  email: string;
  gender: string;
  qualification: string;
  experience: number;
  hospitalName: string;
  consultationMode: string[];
  expertise: string[];
  commonAreas: string[];
  availability: DoctorAvailability[];
  leaves?: string[];   // ISO date strings e.g. "2024-12-25"
}

export interface Appointment {
  _id: string;
  userId: { _id: string; name: string; email: string; gender?: string } | string;
  doctorId: { _id: string; name: string; hospitalName: string; expertise: string[]; consultationMode: string[] } | string;
  date: string;
  dayOfWeek: string;
  status: "pending" | "confirmed" | "cancelled";
  notes: string;
  createdAt: string;
}

export const doctorApi = {
  register: (data: {
    name: string; email: string; password: string; phone: string; gender: string;
    qualification: string; experience: number; licenseNumber: string; hospitalName: string;
    consultationMode: string[]; expertise: string[]; commonAreas: string[];
  }) =>
    request<DoctorAuthResponse>("/doctor/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () => request<{ doctors: DoctorProfile[] }>("/doctor"),

  getById: (id: string) => request<{ doctor: DoctorProfile }>(`/doctor/${id}`),

  updateAvailability: (availability: DoctorAvailability[]) =>
    request<{ doctor: DoctorProfile }>("/doctor/availability", {
      method: "PUT",
      body: JSON.stringify({ availability }),
    }),

  updateLeaves: (leaves: string[]) =>
    request<{ doctor: DoctorProfile }>("/doctor/leaves", {
      method: "PUT",
      body: JSON.stringify({ leaves }),
    }),
};

export const appointmentApi = {
  book: (doctorId: string, date: string, notes?: string) =>
    request<{ appointment: Appointment }>("/appointment", {
      method: "POST",
      body: JSON.stringify({ doctorId, date, notes }),
    }),

  mine: () => request<{ appointments: Appointment[] }>("/appointment/mine"),

  doctorAppointments: () => request<{ appointments: Appointment[] }>("/appointment/doctor"),

  checkAvailability: (doctorId: string, date: string) =>
    request<{ available: boolean; slotsLeft: number | null; limit: number | null; dayOfWeek: string; onLeave?: boolean; openSchedule?: boolean }>(
      `/appointment/availability/${doctorId}/${date}`
    ),

  confirm: (id: string) =>
    request<{ appointment: Appointment }>(`/appointment/${id}/confirm`, { method: "PATCH" }),

  assignNextVisit: (userId: string, date: string, notes?: string) =>
    request<{ appointment: Appointment }>("/appointment/assign", {
      method: "POST",
      body: JSON.stringify({ userId, date, notes }),
    }),

  cancel: (id: string) =>
    request<{ appointment: Appointment }>(`/appointment/${id}`, { method: "DELETE" }),
};

export const notificationApi = {
  getVapidKey: () => request<{ publicKey: string }>("/notifications/vapid-public-key"),

  subscribe: (subscription: PushSubscriptionJSON) =>
    request<{ message: string }>("/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify({ subscription }),
    }),

  unsubscribe: (endpoint: string) =>
    request<{ message: string }>("/notifications/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    }),
};

export interface RoutineTask {
  taskId: string;
  title: string;
  type: "work" | "medication" | "exercise" | "sleep" | "custom";
  time: string;
  enabled: boolean;
}

export const routineApi = {
  list: () => request<{ routines: RoutineTask[] }>("/routine"),

  add: (task: Omit<RoutineTask, "enabled">) =>
    request<{ routine: RoutineTask }>("/routine", {
      method: "POST",
      body: JSON.stringify(task),
    }),

  toggle: (taskId: string) =>
    request<{ routine: RoutineTask }>(`/routine/${taskId}/toggle`, { method: "PATCH" }),

  remove: (taskId: string) =>
    request<{ message: string }>(`/routine/${taskId}`, { method: "DELETE" }),
};

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

  doctorLogin: (email: string, password: string) =>
    request<AuthResponse>("/doctor/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: AuthResponse["user"] }>("/auth/me"),
};
