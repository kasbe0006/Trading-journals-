import { NextResponse } from "next/server";
import { logApiError } from "@/lib/observability";

type ApiErrorBody = {
  error: string;
  code: string;
};

export function ok<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function fail(message: string, status = 500, code = "INTERNAL_ERROR") {
  return NextResponse.json<ApiErrorBody>(
    { error: message, code },
    { status }
  );
}

export function handleApiError(error: unknown, fallbackMessage = "Request failed", route = "unknown") {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const normalized = message.toLowerCase();

  if (normalized.includes("econnrefused") || normalized.includes("serverselection") || normalized.includes("mongodb")) {
    logApiError({ route, error, code: "DB_UNAVAILABLE" });
    return fail("Database is unavailable. Please try again shortly.", 503, "DB_UNAVAILABLE");
  }

  if (normalized.includes("not configured")) {
    logApiError({ route, error, code: "ENV_MISCONFIGURED" });
    return fail(message, 500, "ENV_MISCONFIGURED");
  }

  logApiError({ route, error, code: "INTERNAL_ERROR" });
  return fail(message || fallbackMessage, 500, "INTERNAL_ERROR");
}