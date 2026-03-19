import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import { Trade } from "@/models/Trade";

const tradeUpdateSchema = z.object({
  entry: z.coerce.number().optional(),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  direction: z.enum(["LONG", "SHORT"]).optional(),
  rrRatio: z.coerce.number().optional(),
  result: z.enum(["win", "loss", "breakeven"]).optional(),
  pnl: z.coerce.number().optional(),
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

    await connectDB();
    const { id } = await params;
    const trade = await Trade.findOne({ _id: id, userId: authResult.auth.userId }).lean();
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

    await connectDB();
    const body = await req.json();
    const parsed = tradeUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const { id } = await params;
    const trade = await Trade.findOneAndUpdate(
      { _id: id, userId: authResult.auth.userId },
      parsed.data,
      { new: true }
    );

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

    await connectDB();
    const { id } = await params;
    const deleted = await Trade.findOneAndDelete({ _id: id, userId: authResult.auth.userId });
    if (!deleted) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete trade", "api/trades/[id].delete");
  }
}
