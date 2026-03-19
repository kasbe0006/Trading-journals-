import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { DEMO_AUTH_PAYLOAD, getAuthFromRequest } from "@/lib/auth";
import { findUserById } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  try {
    if (!env.AUTH_ENABLED) {
      return ok({ user: { id: DEMO_AUTH_PAYLOAD.userId, name: "Guest", email: DEMO_AUTH_PAYLOAD.email } });
    }

    const auth = getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await findUserById(auth.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return ok({ user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    return handleApiError(error, "Failed to fetch user profile", "api/auth/me");
  }
}
