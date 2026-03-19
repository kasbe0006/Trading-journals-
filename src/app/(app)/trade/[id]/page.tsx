"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-fetch";

type Trade = {
  _id: string;
  symbol: string;
  tradedAt: string;
  entry: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  direction: "LONG" | "SHORT";
  rrRatio: number;
  result: "win" | "loss" | "breakeven";
  pnl: number;
  strategyTag: string;
  notes: string;
  imageUrl: string;
  tags: string[];
  emotion: string;
  followedPlan: boolean;
  riskPercent: number;
  replayNotes: string;
  aiReview: string;
  createdAt: string;
};

export default function TradeDetailPage() {
  const params = useParams<{ id: string }>();
  const [trade, setTrade] = useState<Trade | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;
      const { data: result } = await fetchJson(`/api/trades/${params.id}`, { cache: "no-store" });
      setTrade((result?.trade as Trade) ?? null);
    };
    load();
  }, [params.id]);

  if (!trade) return <p className="text-slate-400">Loading trade...</p>;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Trade Details</h2>
        <p className="text-sm text-slate-400">{new Date(trade.tradedAt || trade.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Setup Data</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>Direction: {trade.direction}</p>
            <p>Symbol: {trade.symbol || "-"}</p>
            <p>Entry: {trade.entry}</p>
            <p>Exit Price: {trade.exitPrice}</p>
            <p>Stop Loss: {trade.stopLoss}</p>
            <p>Take Profit: {trade.takeProfit}</p>
            <p>RR Ratio: {trade.rrRatio}</p>
            <p>Result: {trade.result}</p>
            <p>P/L: {trade.pnl}</p>
            <p>Emotion: {trade.emotion}</p>
            <p>Followed plan: {trade.followedPlan ? "Yes" : "No"}</p>
            <p>Risk %: {trade.riskPercent}</p>
            <p>Strategy: {trade.strategyTag || "-"}</p>
            <p>Tags: {trade.tags?.join(", ") || "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chart Screenshot</CardTitle>
          </CardHeader>
          <CardContent>
            {trade.imageUrl ? (
              <img src={trade.imageUrl} alt="Trade chart" className="h-auto w-full rounded-lg border border-slate-800" />
            ) : (
              <p className="text-sm text-slate-400">No image attached</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes and Replay</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p><span className="text-slate-400">Notes:</span> {trade.notes || "-"}</p>
          <p><span className="text-slate-400">Replay Notes:</span> {trade.replayNotes || "-"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
