const authEnabled = process.env.AUTH_ENABLED === "true";

const requiredVars = [
  "MONGODB_URI",
  ...(authEnabled ? (["JWT_SECRET"] as const) : ([] as const)),
] as const;

for (const key of requiredVars) {
  if (!process.env[key]) {
    console.warn(`[env] Missing required env var: ${key}`);
  }
}

export const env = {
  MONGODB_URI: process.env.MONGODB_URI ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  AUTH_ENABLED: process.env.AUTH_ENABLED === "true",
  APP_DEMO_MODE: process.env.APP_DEMO_MODE !== "false",
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== "false",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120),
  RATE_LIMIT_AUTH_MAX_REQUESTS: Number(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS ?? 20),
  RATE_LIMIT_UPLOAD_MAX_REQUESTS: Number(process.env.RATE_LIMIT_UPLOAD_MAX_REQUESTS ?? 12),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini",
};
