import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, DEMO_AUTH_PAYLOAD, verifyToken } from "@/lib/auth";
import { env } from "@/lib/env";

export async function requireUser() {
  if (!env.AUTH_ENABLED) {
    return DEMO_AUTH_PAYLOAD;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) redirect("/login");

  const payload = verifyToken(token);
  if (!payload) redirect("/login");

  return payload;
}
