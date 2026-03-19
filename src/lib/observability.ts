type ApiErrorLogInput = {
  route: string;
  error: unknown;
  code?: string;
};

type RateLimitLogInput = {
  route: string;
  key: string;
  limit: number;
  windowMs: number;
};

export function logApiError(input: ApiErrorLogInput) {
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  console.error(`[api-error] route=${input.route} code=${input.code ?? "INTERNAL_ERROR"} message=${message}`);
}

export function logRateLimitExceeded(input: RateLimitLogInput) {
  console.warn(
    `[rate-limit] route=${input.route} key=${input.key} limit=${input.limit} windowMs=${input.windowMs}`
  );
}