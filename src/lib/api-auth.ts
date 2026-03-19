import { NextRequest } from "next/server";
import { AuthPayload, getAuthFromRequest } from "@/lib/auth";
import { env } from "@/lib/env";

const GUEST_USER = {
  userId: "guest-user",
  email: "guest@local",
};

type ApiAuthResult =
  | { auth: AuthPayload }
  | { error: string; status: 401 };

export function requireApiUser(req: NextRequest): ApiAuthResult {
  if (!env.AUTH_ENABLED) {
    return { auth: GUEST_USER };
  }

  const auth = getAuthFromRequest(req);
  if (!auth) {
    return { error: "Unauthorized", status: 401 };
  }

  return { auth };
}
