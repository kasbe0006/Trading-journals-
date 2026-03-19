import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE, signToken } from "@/lib/auth";
import { fail } from "@/lib/api-response";
import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { User } from "@/models/User";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const req = request as Request & { headers: Headers };
    const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limit = checkRateLimit({
      route: "auth/register",
      key,
      limit: env.RATE_LIMIT_AUTH_MAX_REQUESTS,
    });
    if (!limit.ok) {
      return fail("Too many registration attempts. Please try again later.", 429, "RATE_LIMITED");
    }

    await connectDB();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const exists = await User.findOne({ email: parsed.data.email });
    if (exists) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hash = await bcrypt.hash(parsed.data.password, 10);
    const user = await User.create({ ...parsed.data, password: hash });
    const token = signToken({ userId: user._id.toString(), email: user.email });

    const response = NextResponse.json({ id: user._id, email: user.email, name: user.name });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
