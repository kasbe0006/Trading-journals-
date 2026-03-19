const authEnabled = process.env.AUTH_ENABLED === "true";

const requiredVars = [
  "POSTGRES_URL",
  ...(authEnabled ? (["JWT_SECRET"] as const) : ([] as const)),
] as const;

for (const key of requiredVars) {
  if (!process.env[key]) {
    console.warn(`[env] Missing required env var: ${key}`);
  }
}

export const env = {
  POSTGRES_URL: process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  AUTH_ENABLED: process.env.AUTH_ENABLED === "true",
  APP_DEMO_MODE: process.env.APP_DEMO_MODE !== "false",
  DEFAULT_ADMIN_ENABLED: process.env.DEFAULT_ADMIN_ENABLED !== "false",
  DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME ?? "prathamesh kasbe",
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? "prathamesh@local.dev",
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ?? "Unnatikasbe06",
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== "false",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120),
  RATE_LIMIT_AUTH_MAX_REQUESTS: Number(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS ?? 20),
  RATE_LIMIT_UPLOAD_MAX_REQUESTS: Number(process.env.RATE_LIMIT_UPLOAD_MAX_REQUESTS ?? 12),
};
