"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EquityChart } from "@/components/charts/equity-chart";
import { TradingCalendar } from "@/components/dashboard/trading-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-fetch";

type Summary = {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  maxDrawdown: number;
  equityCurve: Array<{ date: string; equity: number; pnl: number }>;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: analyticsResult } = await fetchJson("/api/analytics/summary", { cache: "no-store" });
      setSummary((analyticsResult?.summary as Summary) ?? null);
    };
    load();
  }, []);

  const calendarData = summary?.equityCurve.map((point) => ({ date: point.date, pnl: point.pnl })) ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-400">Your trading edge at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Trades" value={summary?.totalTrades ?? 0} helper="All logged setups" />
        <MetricCard
          title="Win Rate"
          value={`${summary?.winRate ?? 0}%`}
          helper={(summary?.winRate ?? 0) >= 50 ? "Healthy execution" : "Needs process tuning"}
          tone={(summary?.winRate ?? 0) >= 50 ? "positive" : "negative"}
        />
        <MetricCard
          title="Total P/L"
          value={summary?.totalPnl ?? 0}
          helper={(summary?.totalPnl ?? 0) >= 0 ? "Equity trending up" : "Recovery phase"}
          tone={(summary?.totalPnl ?? 0) >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="Max Drawdown"
          value={summary?.maxDrawdown ?? 0}
          helper="Control this to protect edge"
          tone="negative"
        />
      </div>

      <Card className="surface-elevated">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <p className="font-medium text-slate-100">Session Focus</p>
          <p>Prioritize A+ setups, fixed risk, and plan adherence.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <EquityChart data={summary?.equityCurve ?? []} />
        </CardContent>
      </Card>

      <TradingCalendar data={calendarData} />
    </div>
  );
}
