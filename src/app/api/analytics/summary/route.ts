import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { computeTradeAnalytics } from "@/lib/analytics";
import { listTradesByUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const authResult = requireApiUser(req);
    if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const trades = await listTradesByUser(authResult.auth.userId);
    const summary = computeTradeAnalytics(trades);

    return ok({ summary });
  } catch (error) {
    return handleApiError(error, "Failed to fetch analytics", "api/analytics/summary");
  }
}
