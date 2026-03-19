import { ITrade } from "@/models/Trade";

export function computeTradeAnalytics(trades: ITrade[]) {
  const totalTrades = trades.length;
  const wins = trades.filter((trade) => trade.result === "win").length;
  const losses = trades.filter((trade) => trade.result === "loss").length;
  const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(2)) : 0;
  const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  let peak = 0;
  let equity = 0;
  let maxDrawdown = 0;

  const equityCurve = trades
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((trade) => {
      equity += trade.pnl || 0;
      peak = Math.max(peak, equity);
      maxDrawdown = Math.min(maxDrawdown, equity - peak);
      return {
        date: new Date(trade.createdAt).toISOString().slice(0, 10),
        equity,
        pnl: trade.pnl || 0,
      };
    });

  const strategyMap: Record<string, { count: number; wins: number; pnl: number }> = {};
  const dayMap: Record<string, number> = {};
  const rrDistribution: Array<{ bucket: string; count: number }> = [
    { bucket: "<1", count: 0 },
    { bucket: "1-1.5", count: 0 },
    { bucket: "1.5-2", count: 0 },
    { bucket: ">2", count: 0 },
  ];

  for (const trade of trades) {
    const tag = trade.strategyTag || "Uncategorized";
    if (!strategyMap[tag]) strategyMap[tag] = { count: 0, wins: 0, pnl: 0 };
    strategyMap[tag].count += 1;
    strategyMap[tag].wins += trade.result === "win" ? 1 : 0;
    strategyMap[tag].pnl += trade.pnl || 0;

    const day = new Date(trade.createdAt).toLocaleDateString("en-US", { weekday: "short" });
    dayMap[day] = (dayMap[day] ?? 0) + (trade.pnl || 0);

    const rr = trade.rrRatio || 0;
    if (rr < 1) rrDistribution[0].count += 1;
    else if (rr < 1.5) rrDistribution[1].count += 1;
    else if (rr < 2) rrDistribution[2].count += 1;
    else rrDistribution[3].count += 1;
  }

  const strategyStats = Object.entries(strategyMap).map(([strategy, value]) => ({
    strategy,
    trades: value.count,
    winRate: value.count > 0 ? Number(((value.wins / value.count) * 100).toFixed(2)) : 0,
    pnl: Number(value.pnl.toFixed(2)),
  }));

  const profitByDay = Object.entries(dayMap).map(([day, pnl]) => ({ day, pnl: Number(pnl.toFixed(2)) }));

  return {
    totalTrades,
    wins,
    losses,
    winRate,
    totalPnl: Number(totalPnl.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    equityCurve,
    strategyStats,
    profitByDay,
    rrDistribution,
  };
}
