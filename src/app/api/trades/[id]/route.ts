import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { deleteTrade, findTradeById, updateTrade } from "@/lib/db";
import { calculateRrRatio, calculateTradeOutcome } from "@/lib/trade-math";

const tradeUpdateSchema = z.object({
  symbol: z.string().min(1).optional(),
  tradedAt: z.coerce.date().optional(),
  entry: z.coerce.number().optional(),
  exitPrice: z.coerce.number().optional(),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  direction: z.enum(["LONG", "SHORT"]).optional(),
  strategyTag: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  emotion: z.enum(["fear", "confidence", "greed", "calm", "frustration"]).optional(),
  followedPlan: z.coerce.boolean().optional(),
  riskPercent: z.coerce.number().optional(),
  replayNotes: z.string().optional(),
  aiReview: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authResult = requireApiUser(req);
    if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const { id } = await params;
    const trade = await findTradeById(authResult.auth.userId, id);
    if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    return ok({ trade });
  } catch (error) {
    return handleApiError(error, "Failed to fetch trade", "api/trades/[id].get");
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authResult = requireApiUser(req);
    if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const body = await req.json();
    const parsed = tradeUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const { id } = await params;
    const existingTrade = await findTradeById(authResult.auth.userId, id);
    if (!existingTrade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    const nextEntry = parsed.data.entry ?? existingTrade.entry;
    const nextExitPrice = parsed.data.exitPrice ?? existingTrade.exitPrice;
    const nextStopLoss = parsed.data.stopLoss ?? existingTrade.stopLoss;
    const nextTakeProfit = parsed.data.takeProfit ?? existingTrade.takeProfit;
    const nextDirection = parsed.data.direction ?? existingTrade.direction;

    const rrRatio = calculateRrRatio(nextEntry, nextStopLoss, nextTakeProfit);
    const { pnl, result } = calculateTradeOutcome(nextEntry, nextExitPrice, nextDirection);

    const trade = await updateTrade(authResult.auth.userId, id, {
      ...parsed.data,
      symbol: parsed.data.symbol ? parsed.data.symbol.trim().toUpperCase() : existingTrade.symbol || "NIFTY",
      rrRatio,
      pnl,
      result,
    });

    if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    return ok({ trade });
  } catch (error) {
    return handleApiError(error, "Failed to update trade", "api/trades/[id].patch");
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authResult = requireApiUser(req);
    if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const { id } = await params;
    const deleted = await deleteTrade(authResult.auth.userId, id);
    if (!deleted) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete trade", "api/trades/[id].delete");
  }
}
