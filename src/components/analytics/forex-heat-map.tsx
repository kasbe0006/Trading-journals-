"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/client-fetch";

type Trade = {
  tradedAt?: string;
  createdAt?: string;
  pnl?: number;
};

type HeatCell = {
  key: string;
  date: Date;
  value: number;
  pnl: number;
  inRange: boolean;
};

const CELL_SIZE = 12;
const CELL_GAP = 3;

export function ForexHeatMap() {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const loadTrades = async () => {
      const { data } = await fetchJson("/api/trades", { cache: "no-store" });
      setTrades(((data?.trades as Trade[]) ?? []).filter(Boolean));
    };

    loadTrades();
  }, []);

  const dateMap = useMemo(() => {
    const map = new Map<string, { count: number; pnl: number }>();
    for (const trade of trades) {
      const sourceDate = trade.tradedAt || trade.createdAt;
      if (!sourceDate) continue;
      const dayKey = new Date(sourceDate).toISOString().slice(0, 10);
      const previous = map.get(dayKey);
      map.set(dayKey, {
        count: (previous?.count ?? 0) + 1,
        pnl: (previous?.pnl ?? 0) + (Number(trade.pnl) || 0),
      });
    }
    return map;
  }, [trades]);

  const gridData = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);

    const start = new Date(end);
    start.setDate(end.getDate() - 364);

    const weekStart = new Date(start);
    const dayOfWeek = weekStart.getDay();
    const offset = (dayOfWeek + 6) % 7;
    weekStart.setDate(weekStart.getDate() - offset);

    const totalDays = Math.ceil((end.getTime() - weekStart.getTime()) / 86_400_000) + 1;
    const weekCount = Math.ceil(totalDays / 7);

    const columns: HeatCell[][] = [];
    for (let week = 0; week < weekCount; week += 1) {
      const column: HeatCell[] = [];
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + week * 7 + day);
        const key = date.toISOString().slice(0, 10);
        const payload = dateMap.get(key);
        const inRange = date >= start && date <= end;
        column.push({
          key,
          date,
          value: inRange ? (payload?.count ?? 0) : 0,
          pnl: inRange ? Number((payload?.pnl ?? 0).toFixed(2)) : 0,
          inRange,
        });
      }
      columns.push(column);
    }

    return { columns, weekCount };
  }, [dateMap]);

  const maxValue = useMemo(
    () => Math.max(0, ...gridData.columns.flat().map((cell) => cell.value)),
    [gridData.columns]
  );

  const activeDays = useMemo(
    () => gridData.columns.flat().filter((cell) => cell.inRange && cell.value > 0).length,
    [gridData.columns]
  );

  const totalTrades = useMemo(
    () => gridData.columns.flat().reduce((sum, cell) => sum + (cell.inRange ? cell.value : 0), 0),
    [gridData.columns]
  );

  const getLevelClass = (value: number) => {
    if (value <= 0) return "bg-slate-800/70";
    if (maxValue <= 1) return "bg-emerald-500/60";

    const ratio = value / maxValue;
    if (ratio <= 0.25) return "bg-emerald-900";
    if (ratio <= 0.5) return "bg-emerald-700";
    if (ratio <= 0.75) return "bg-emerald-500";
    return "bg-emerald-300";
  };

  const monthLabels = useMemo(() => {
    const labels: Array<{ index: number; text: string }> = [];
    let previousMonth = -1;
    let lastIndex = -999;

    for (let index = 0; index < gridData.weekCount; index += 1) {
      const date = gridData.columns[index]?.find((cell) => cell.inRange)?.date;
      if (!date) continue;
      const month = date.getMonth();
      if (month !== previousMonth && index - lastIndex >= 3) {
        labels.push({ index, text: date.toLocaleDateString(undefined, { month: "short" }) });
        previousMonth = month;
        lastIndex = index;
      }
    }

    return labels;
  }, [gridData.columns, gridData.weekCount]);

  const weekdayLabels = ["Mon", "Wed", "Fri"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forex Trade Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <p>Last 365 days • {activeDays} active days</p>
          <p>{totalTrades} total trades</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div className="min-w-[760px]">
            <div className="mb-2 flex" style={{ paddingLeft: 44 }}>
              <div className="relative" style={{ width: gridData.weekCount * (CELL_SIZE + CELL_GAP) - CELL_GAP, height: 16 }}>
                {monthLabels.map((label) => (
                  <span
                    key={`${label.text}-${label.index}`}
                    className="absolute text-[11px] text-slate-400"
                    style={{ left: label.index * (CELL_SIZE + CELL_GAP) }}
                  >
                    {label.text}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex">
              <div className="mr-2 flex flex-col" style={{ gap: CELL_GAP }}>
                {Array.from({ length: 7 }).map((_, row) => (
                  <div key={row} className="flex items-center justify-end text-[11px] text-slate-400" style={{ width: 40, height: CELL_SIZE }}>
                    {row === 1 ? weekdayLabels[0] : row === 3 ? weekdayLabels[1] : row === 5 ? weekdayLabels[2] : ""}
                  </div>
                ))}
              </div>

              <div className="flex" style={{ gap: CELL_GAP }}>
                {gridData.columns.map((column, columnIndex) => (
                  <div key={`col-${columnIndex}`} className="flex flex-col" style={{ gap: CELL_GAP }}>
                    {column.map((cell) => (
                      <button
                        key={cell.key}
                        type="button"
                        disabled={!cell.inRange}
                        title={
                          cell.inRange
                            ? `${cell.value} trades on ${cell.date.toLocaleDateString()} | P/L ${cell.pnl}`
                            : "Outside selected range"
                        }
                        className={cn(
                          "rounded-[3px] transition-opacity",
                          getLevelClass(cell.value),
                          !cell.inRange && "opacity-25",
                          cell.inRange && "hover:opacity-80"
                        )}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-slate-400">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={`legend-${level}`}
              className={cn("inline-block rounded-[3px]", getLevelClass(level === 0 ? 0 : Math.ceil((level / 4) * Math.max(1, maxValue))))}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
