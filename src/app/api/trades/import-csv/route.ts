import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { handleApiError, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/api-auth";
import { insertTradesBulk } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { calculateRrRatio, calculateTradeOutcome } from "@/lib/trade-math";

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

    const docs = parsed.data.map((row) => {
      const entry = Number(row.entry ?? 0);
      const stopLoss = Number(row.stopLoss ?? 0);
      const takeProfit = Number(row.takeProfit ?? 0);
      const lotSize = Number(row.lotSize ?? row.lot ?? 1);
      const normalizedLotSize = Number.isFinite(lotSize) && lotSize > 0 ? lotSize : 1;
      const direction: "LONG" | "SHORT" = row.direction === "SHORT" ? "SHORT" : "LONG";
      const exitPrice = Number(row.exitPrice ?? row.exit ?? row.entry ?? 0);

      const rrRatio = calculateRrRatio(entry, stopLoss, takeProfit);
      const { pnl, result } = calculateTradeOutcome(entry, exitPrice, direction, normalizedLotSize);

      return {
        userId: authResult.auth.userId,
        symbol: String(row.symbol ?? row.ticker ?? "NIFTY").trim().toUpperCase(),
        tradedAt: row.tradedAt || row.date ? new Date(row.tradedAt ?? row.date ?? new Date()) : new Date(),
        lotSize: normalizedLotSize,
        entry,
        exitPrice,
        stopLoss,
        takeProfit,
        direction,
        rrRatio,
        result,
        pnl,
        strategyTag: row.strategyTag ?? "",
        notes: row.notes ?? "",
      };
    });

    if (docs.length > 0) {
      await insertTradesBulk(docs);
    }

    return ok({ imported: docs.length });
  } catch (error) {
    return handleApiError(error, "Failed to import CSV", "api/trades/import-csv");
  }
}
