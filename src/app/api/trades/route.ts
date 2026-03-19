import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { createTrade, listTradesByUser } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { calculateRrRatio, calculateTradeOutcome } from "@/lib/trade-math";

const tradeSchema = z.object({
  symbol: z.string().min(1),
  tradedAt: z.coerce.date().optional(),
  lotSize: z.coerce.number().positive().optional().default(1),
  entry: z.coerce.number(),
  exitPrice: z.coerce.number(),
  stopLoss: z.coerce.number(),
  takeProfit: z.coerce.number(),
  direction: z.enum(["LONG", "SHORT"]),
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

    const trades = await listTradesByUser(authResult.auth.userId);
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

    const body = await req.json();
    const parsed = tradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid trade payload", issues: parsed.error.flatten() }, { status: 400 });
    }

    const rrRatio = calculateRrRatio(parsed.data.entry, parsed.data.stopLoss, parsed.data.takeProfit);
    const { pnl, result } = calculateTradeOutcome(parsed.data.entry, parsed.data.exitPrice, parsed.data.direction, parsed.data.lotSize);

    const trade = await createTrade({
      ...parsed.data,
      tradedAt: parsed.data.tradedAt ?? new Date(),
      rrRatio,
      pnl,
      result,
      userId: authResult.auth.userId,
    });
    return ok({ trade }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create trade", "api/trades.post");
  }
}
