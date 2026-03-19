import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";

export const AUTH_COOKIE = "ajt_token";

export type AuthPayload = {
  userId: string;
  email: string;
};

export const DEMO_AUTH_PAYLOAD: AuthPayload = {
  userId: "000000000000000000000001",
  email: "guest@local",
};

export function signToken(payload: AuthPayload) {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "14d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    if (!env.JWT_SECRET) return null;
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}

export function getAuthFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
