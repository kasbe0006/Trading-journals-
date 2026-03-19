import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { Trade } from "@/models/Trade";

const tradeSchema = z.object({
  entry: z.coerce.number(),
  stopLoss: z.coerce.number(),
  takeProfit: z.coerce.number(),
  direction: z.enum(["LONG", "SHORT"]),
  rrRatio: z.coerce.number(),
  result: z.enum(["win", "loss", "breakeven"]).default("breakeven"),
  pnl: z.coerce.number().default(0),
  strategyTag: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  emotion: z.enum(["fear", "confidence", "greed", "calm", "frustration"]).optional().default("calm"),
  followedPlan: z.coerce.boolean().optional().default(true),
  riskPercent: z.coerce.number().optional().default(1),
  replayNotes: z.string().optional().default(""),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = requireApiUser(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const trades = await Trade.find({ userId: authResult.auth.userId }).sort({ createdAt: -1 }).lean();
    return ok({ trades });
  } catch (error) {
    return handleApiError(error, "Failed to fetch trades", "api/trades.get");
  }
}

export async function POST(req: NextRequest) {
  try {
    const limit = checkRateLimit({
      route: "trades/create",
      key: getRateLimitKey(req),
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly.", code: "RATE_LIMITED" }, { status: 429 });
    }

    const authResult = requireApiUser(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid trade payload", issues: parsed.error.flatten() }, { status: 400 });
    }

    const trade = await Trade.create({ ...parsed.data, userId: authResult.auth.userId });
    return ok({ trade }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create trade", "api/trades.post");
  }
}
