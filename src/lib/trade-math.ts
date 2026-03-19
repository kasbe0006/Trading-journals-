export type TradeDirection = "LONG" | "SHORT";
export const FOREX_STANDARD_LOT_UNITS = 100000;

export function calculateRrRatio(entry: number, stopLoss: number, takeProfit: number) {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);

  if (!Number.isFinite(risk) || !Number.isFinite(reward) || risk <= 0) {
    return 0;
  }

  return Number((reward / risk).toFixed(2));
}

export function calculateTradeOutcome(entry: number, exitPrice: number, direction: TradeDirection, lotSize = 1) {
  const units = Math.max(0, Number.isFinite(lotSize) ? lotSize : 0) * FOREX_STANDARD_LOT_UNITS;
  const rawPnlPerUnit = direction === "LONG" ? exitPrice - entry : entry - exitPrice;
  const rawPnl = rawPnlPerUnit * units;
  const pnl = Number(rawPnl.toFixed(2));

  if (Math.abs(pnl) < 1e-9) {
    return { pnl: 0, result: "breakeven" as const };
  }

  return {
    pnl,
    result: pnl > 0 ? ("win" as const) : ("loss" as const),
  };
}
