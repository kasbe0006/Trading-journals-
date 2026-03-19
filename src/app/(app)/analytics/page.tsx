"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RRChart } from "@/components/charts/rr-chart";
import { StrategyChart } from "@/components/charts/strategy-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-fetch";

type Summary = {
  strategyStats: Array<{ strategy: string; winRate: number; pnl: number; trades: number }>;
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
    </div>
  );
}
