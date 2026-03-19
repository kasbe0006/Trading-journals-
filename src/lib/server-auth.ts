import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import { env } from "@/lib/env";

export async function requireUser() {
  if (!env.AUTH_ENABLED) {
    return { userId: "guest-user", email: "guest@local" };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) redirect("/login");

  const payload = verifyToken(token);
  if (!payload) redirect("/login");

  return payload;
}
