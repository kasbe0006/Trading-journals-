import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { handleApiError, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { Trade } from "@/models/Trade";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const limit = checkRateLimit({
      route: "trades/import-csv",
      key: getRateLimitKey(req),
      limit: env.RATE_LIMIT_UPLOAD_MAX_REQUESTS,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many imports. Please try again later.", code: "RATE_LIMITED" }, { status: 429 });
    }

    const authResult = requireApiUser(req);
    if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "CSV file is required" }, { status: 400 });

    const csv = await file.text();
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });

    await connectDB();

    const docs = parsed.data.map((row) => ({
      userId: authResult.auth.userId,
      entry: Number(row.entry ?? 0),
      stopLoss: Number(row.stopLoss ?? 0),
      takeProfit: Number(row.takeProfit ?? 0),
      direction: row.direction === "SHORT" ? "SHORT" : "LONG",
      rrRatio: Number(row.rrRatio ?? 0),
      result: row.result === "win" || row.result === "loss" ? row.result : "breakeven",
      pnl: Number(row.pnl ?? 0),
      strategyTag: row.strategyTag ?? "",
      notes: row.notes ?? "",
    }));

    if (docs.length > 0) {
      await Trade.insertMany(docs);
    }

    return ok({ imported: docs.length });
  } catch (error) {
    return handleApiError(error, "Failed to import CSV", "api/trades/import-csv");
  }
}
