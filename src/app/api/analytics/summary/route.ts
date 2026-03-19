import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { computeTradeAnalytics } from "@/lib/analytics";
import { connectDB } from "@/lib/db";
import { Trade } from "@/models/Trade";
import type { ITrade } from "@/models/Trade";

export async function GET(req: NextRequest) {
  try {
    const authResult = requireApiUser(req);
    if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const trades = await Trade.find({ userId: authResult.auth.userId }).lean();
    const summary = computeTradeAnalytics(trades as unknown as ITrade[]);

    return ok({ summary });
  } catch (error) {
    return handleApiError(error, "Failed to fetch analytics", "api/analytics/summary");
  }
}
