import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE, signToken } from "@/lib/auth";
import { findUserByIdentifier } from "@/lib/db";
import { env } from "@/lib/env";
import { fail } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  identifier: z.string().min(2),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const req = request as Request & { headers: Headers };
    const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limit = checkRateLimit({
      route: "auth/login",
      key,
      limit: env.RATE_LIMIT_AUTH_MAX_REQUESTS,
    });
    if (!limit.ok) {
      return fail("Too many login attempts. Please try again later.", 429, "RATE_LIMITED");
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const identifier = parsed.data.identifier.trim();
    const user = await findUserByIdentifier(identifier);
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const isValid = await bcrypt.compare(parsed.data.password, user.password);
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = signToken({ userId: user._id, email: user.email });
    const response = NextResponse.json({ id: user._id, email: user.email, name: user.name, token });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
