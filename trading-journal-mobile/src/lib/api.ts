import { API_BASE_URL } from "./config";
import { CreateTradePayload, Trade, User } from "./types";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  login: async (identifier: string, password: string) => {
    return request<{ id: string; email: string; name: string; token: string }>("/api/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
  },

  me: async (token: string) => {
    const res = await request<{ user: User }>("/api/auth/me", { token });
    return res.user;
  },

  listTrades: async (token: string) => {
    const res = await request<{ trades: Trade[] }>("/api/trades", { token });
    return res.trades;
  },

  createTrade: async (token: string, payload: CreateTradePayload) => {
    const res = await request<{ trade: Trade }>("/api/trades", {
      method: "POST",
      token,
      body: payload,
    });
    return res.trade;
  },
};
