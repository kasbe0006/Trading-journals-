"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-fetch";

type Trade = {
  tradedAt?: string;
  createdAt?: string;
};

type HeatApi = {
  render: (element: HTMLElement, options?: Record<string, unknown>) => HeatApi;
  addDate: (id: string, date: Date, trendType?: string | null, refresh?: boolean) => HeatApi;
  updateDate: (id: string, date: Date, count: number, trendType?: string | null, refresh?: boolean) => HeatApi;
  reset: (id: string, refresh?: boolean) => HeatApi;
  refresh: (id: string) => HeatApi;
  setYearToHighest: (id: string) => HeatApi;
  destroy: (id: string) => HeatApi;
};

declare global {
  interface Window {
    $heat?: HeatApi;
  }
}

const HEATMAP_ID = "forex-trades-heatmap";

export function ForexHeatMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    const loadTrades = async () => {
      const { data } = await fetchJson("/api/trades", { cache: "no-store" });
      setTrades(((data?.trades as Trade[]) ?? []).filter(Boolean));
    };

    loadTrades();
  }, []);

  const dateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const trade of trades) {
      const sourceDate = trade.tradedAt || trade.createdAt;
      if (!sourceDate) continue;
      const dayKey = new Date(sourceDate).toISOString().slice(0, 10);
      counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
    }
    return counts;
  }, [trades]);

  useEffect(() => {
    const init = () => {
      const api = window.$heat;
      const element = containerRef.current;
      if (!api || !element) return;

      api.destroy(HEATMAP_ID);
      api.render(element, {
        enabledTooltips: true,
        allowViewMap: true,
        allowViewLine: false,
        allowViewChart: false,
        allowViewDays: false,
        allowViewMonths: false,
        allowViewColorRanges: false,
        views: {
          defaultView: "map",
          map: {
            showDayNames: true,
          },
        },
      });

      api.reset(HEATMAP_ID, false);
      for (const [day, count] of dateCounts.entries()) {
        for (let index = 0; index < count; index += 1) {
          api.addDate(HEATMAP_ID, new Date(day), null, false);
        }
      }
      api.setYearToHighest(HEATMAP_ID);
      api.refresh(HEATMAP_ID);
      setIsReady(true);
    };

    if (scriptReady) {
      init();
    }

    return () => {
      if (window.$heat) {
        window.$heat.destroy(HEATMAP_ID);
      }
    };
  }, [dateCounts, scriptReady]);

  return (
    <Card>
      <Script src="/vendor/heat.min.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <CardHeader>
        <CardTitle>Forex Trade Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          id={HEATMAP_ID}
          ref={containerRef}
          className="min-h-[260px] rounded-lg border border-slate-800 bg-slate-950/40 p-2"
        />
        {!isReady && <p className="mt-2 text-xs text-slate-400">Loading heatmap...</p>}
      </CardContent>
    </Card>
  );
}
