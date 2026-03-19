type AnalyticsTrade = {
  result: "win" | "loss" | "breakeven";
  pnl: number;
  rrRatio: number;
  strategyTag?: string;
  symbol?: string;
  tradedAt?: Date | string;
  createdAt?: Date | string;
};

export function computeTradeAnalytics(trades: AnalyticsTrade[]) {
  const totalTrades = trades.length;
  const wins = trades.filter((trade) => trade.result === "win").length;
  const losses = trades.filter((trade) => trade.result === "loss").length;
  const breakeven = trades.filter((trade) => trade.result === "breakeven").length;
  const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(2)) : 0;
  const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  const totalWinPnl = trades
    .filter((trade) => (trade.pnl || 0) > 0)
    .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalLossPnlAbs = Math.abs(
    trades
      .filter((trade) => (trade.pnl || 0) < 0)
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  );
  const profitFactor = totalLossPnlAbs > 0 ? Number((totalWinPnl / totalLossPnlAbs).toFixed(2)) : 0;

  const averageWin = wins > 0 ? Number((totalWinPnl / wins).toFixed(2)) : 0;
  const averageLoss = losses > 0 ? Number((-totalLossPnlAbs / losses).toFixed(2)) : 0;

  let peak = 0;
  let equity = 0;
  let maxDrawdown = 0;

  const getTradeTimestamp = (trade: AnalyticsTrade) => {
    const value = (trade.tradedAt as Date | string | undefined) ?? trade.createdAt ?? new Date(0);
    return new Date(value);
  };

  const equityCurve = trades
    .sort((a, b) => +getTradeTimestamp(a) - +getTradeTimestamp(b))
    .map((trade) => {
      equity += trade.pnl || 0;
      peak = Math.max(peak, equity);
      maxDrawdown = Math.min(maxDrawdown, equity - peak);
      return {
        date: getTradeTimestamp(trade).toISOString().slice(0, 10),
        equity,
        pnl: trade.pnl || 0,
      };
    });

  const strategyMap: Record<string, { count: number; wins: number; pnl: number }> = {};
  const symbolMap: Record<string, { count: number; wins: number; pnl: number }> = {};
  const dayMap: Record<string, number> = {};
  const rrDistribution: Array<{ bucket: string; count: number }> = [
    { bucket: "<1", count: 0 },
    { bucket: "1-1.5", count: 0 },
    { bucket: "1.5-2", count: 0 },
    { bucket: ">2", count: 0 },
  ];

  for (const trade of trades) {
    const tag = trade.strategyTag || "Uncategorized";
    const symbol = (trade.symbol as string | undefined)?.toUpperCase() || "UNKNOWN";

    if (!strategyMap[tag]) strategyMap[tag] = { count: 0, wins: 0, pnl: 0 };
    strategyMap[tag].count += 1;
    strategyMap[tag].wins += trade.result === "win" ? 1 : 0;
    strategyMap[tag].pnl += trade.pnl || 0;

    if (!symbolMap[symbol]) symbolMap[symbol] = { count: 0, wins: 0, pnl: 0 };
    symbolMap[symbol].count += 1;
    symbolMap[symbol].wins += trade.result === "win" ? 1 : 0;
    symbolMap[symbol].pnl += trade.pnl || 0;

    const day = getTradeTimestamp(trade).toLocaleDateString("en-US", { weekday: "short" });
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

  const symbolStats = Object.entries(symbolMap)
    .map(([symbol, value]) => ({
      symbol,
      trades: value.count,
      winRate: value.count > 0 ? Number(((value.wins / value.count) * 100).toFixed(2)) : 0,
      pnl: Number(value.pnl.toFixed(2)),
    }))
    .sort((a, b) => b.trades - a.trades);

  return {
    totalTrades,
    wins,
    losses,
    breakeven,
    winRate,
    totalPnl: Number(totalPnl.toFixed(2)),
    profitFactor,
    averageWin,
    averageLoss,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    equityCurve,
    strategyStats,
    symbolStats,
    profitByDay,
    rrDistribution,
  };
}
