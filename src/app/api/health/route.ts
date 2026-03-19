import { connectDB } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    return ok({
      ok: true,
      database: "up",
      authEnabled: env.AUTH_ENABLED,
      rateLimitEnabled: env.RATE_LIMIT_ENABLED,
    });
  } catch {
    return ok({
      ok: false,
      database: "down",
      authEnabled: env.AUTH_ENABLED,
      rateLimitEnabled: env.RATE_LIMIT_ENABLED,
    }, 200);
  }
}