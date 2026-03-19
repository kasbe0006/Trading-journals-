"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RRChart } from "@/components/charts/rr-chart";
import { StrategyChart } from "@/components/charts/strategy-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-fetch";

type Summary = {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  totalPnl: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  strategyStats: Array<{ strategy: string; winRate: number; pnl: number; trades: number }>;
  symbolStats: Array<{ symbol: string; winRate: number; pnl: number; trades: number }>;
  profitByDay: Array<{ day: string; pnl: number }>;
  rrDistribution: Array<{ bucket: string; count: number }>;
  maxDrawdown: number;
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const load = async () => {
      const { data: result } = await fetchJson("/api/analytics/summary", { cache: "no-store" });
      setSummary((result?.summary as Summary) ?? null);
    };
    load();
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <p className="text-sm text-slate-400">Find your edge using high-impact stats.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="surface-card kpi-glow">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total Trades</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{summary?.totalTrades ?? 0}</p>
            <p className="mt-1 text-xs text-slate-400">
              Wins {summary?.wins ?? 0} • Losses {summary?.losses ?? 0} • BE {summary?.breakeven ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card kpi-glow">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Win Rate</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{summary?.winRate ?? 0}%</p>
            <p className="mt-1 text-xs text-slate-400">Profit factor {summary?.profitFactor ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="surface-card kpi-glow">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Average Win</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{summary?.averageWin ?? 0}</p>
            <p className="mt-1 text-xs text-slate-400">Average loss {summary?.averageLoss ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="surface-card kpi-glow">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-slate-400">Net P/L</p>
            <p className={`mt-2 text-2xl font-semibold ${(summary?.totalPnl ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {summary?.totalPnl ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">Max drawdown {summary?.maxDrawdown ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Win Rate by Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <StrategyChart data={summary?.strategyStats ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RR Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RRChart data={summary?.rrDistribution ?? []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit by Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.profitByDay ?? []}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                  <Bar dataKey="pnl" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drawdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">Maximum drawdown: {summary?.maxDrawdown ?? 0}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Symbols</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Trades</th>
                  <th className="pb-2">Win Rate</th>
                  <th className="pb-2">P/L</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.symbolStats ?? []).slice(0, 8).map((item) => (
                  <tr key={item.symbol} className="border-t border-slate-800">
                    <td className="py-2 font-medium text-slate-100">{item.symbol}</td>
                    <td className="py-2">{item.trades}</td>
                    <td className="py-2">{item.winRate}%</td>
                    <td className={`py-2 ${item.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{item.pnl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
