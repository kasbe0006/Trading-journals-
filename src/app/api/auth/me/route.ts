import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { getAuthFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    if (!env.AUTH_ENABLED) {
      return ok({ user: { id: "guest-user", name: "Guest", email: "guest@local" } });
    }

    const auth = getAuthFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(auth.userId).select("name email");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return ok({ user });
  } catch (error) {
    return handleApiError(error, "Failed to fetch user profile", "api/auth/me");
  }
}
