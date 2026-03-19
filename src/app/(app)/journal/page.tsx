"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/client-fetch";
import { calculateRrRatio, calculateTradeOutcome } from "@/lib/trade-math";
import { defaultUserSettings, loadUserSettings, UserSettings } from "@/lib/user-settings";

const getLocalDateTimeInputValue = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
};

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
  emotion: "fear" | "confidence" | "greed" | "calm" | "frustration";
  followedPlan: boolean;
  riskPercent: number;
  replayNotes?: string;
  createdAt: string;
};

type TradeForm = {
  symbol: string;
  tradedAt: string;
  entry: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  direction: "LONG" | "SHORT";
  rrRatio: string;
  strategyTag: string;
  notes: string;
  imageUrl: string;
  tags: string;
  emotion: "fear" | "confidence" | "greed" | "calm" | "frustration";
  followedPlan: boolean;
  riskPercent: string;
  replayNotes: string;
};

const getInitialForm = (settings: UserSettings): TradeForm => ({
  symbol: "NIFTY",
  tradedAt: getLocalDateTimeInputValue(),
  entry: "",
  exitPrice: "",
  stopLoss: "",
  takeProfit: "",
  direction: "LONG",
  rrRatio: "",
  strategyTag: "",
  notes: "",
  imageUrl: "",
  tags: "",
  emotion: settings.defaultEmotion,
  followedPlan: true,
  riskPercent: String(settings.defaultRiskPercent),
  replayNotes: "",
});

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [form, setForm] = useState<TradeForm>(getInitialForm(defaultUserSettings));
  const [editForm, setEditForm] = useState<TradeForm>(getInitialForm(defaultUserSettings));
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | Trade["result"]>("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | Trade["direction"]>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "bestPnl" | "worstPnl">("newest");

  const loadTrades = async () => {
    const { data: result } = await fetchJson("/api/trades", { cache: "no-store" });
    setTrades((result?.trades as Trade[]) || []);
  };

  useEffect(() => {
    const loadedSettings = loadUserSettings();
    setSettings(loadedSettings);
    setForm((previous) => ({
      ...previous,
      riskPercent: String(loadedSettings.defaultRiskPercent),
      emotion: loadedSettings.defaultEmotion,
    }));
    setEditForm((previous) => ({
      ...previous,
      riskPercent: String(loadedSettings.defaultRiskPercent),
      emotion: loadedSettings.defaultEmotion,
    }));

    loadTrades();
  }, []);

  const computedRr = useMemo(() => {
    const entry = Number(form.entry);
    const sl = Number(form.stopLoss);
    const tp = Number(form.takeProfit);
    if (!entry || !sl || !tp) return "";
    const rr = calculateRrRatio(entry, sl, tp);
    return rr > 0 ? rr.toFixed(2) : "";
  }, [form.entry, form.stopLoss, form.takeProfit]);

  const computedOutcome = useMemo(() => {
    const entry = Number(form.entry);
    const exitPrice = Number(form.exitPrice);
    if (!entry || !exitPrice) {
      return { result: "breakeven" as const, pnl: "0.00" };
    }
    const { result, pnl } = calculateTradeOutcome(entry, exitPrice, form.direction);
    return { result, pnl: pnl.toFixed(2) };
  }, [form.direction, form.entry, form.exitPrice]);

  const editComputedRr = useMemo(() => {
    const entry = Number(editForm.entry);
    const sl = Number(editForm.stopLoss);
    const tp = Number(editForm.takeProfit);
    if (!entry || !sl || !tp) return "";
    const rr = calculateRrRatio(entry, sl, tp);
    return rr > 0 ? rr.toFixed(2) : "";
  }, [editForm.entry, editForm.stopLoss, editForm.takeProfit]);

  const editComputedOutcome = useMemo(() => {
    const entry = Number(editForm.entry);
    const exitPrice = Number(editForm.exitPrice);
    if (!entry || !exitPrice) {
      return { result: "breakeven" as const, pnl: "0.00" };
    }
    const { result, pnl } = calculateTradeOutcome(entry, exitPrice, editForm.direction);
    return { result, pnl: pnl.toFixed(2) };
  }, [editForm.direction, editForm.entry, editForm.exitPrice]);

  const filteredTrades = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const next = trades.filter((trade) => {
      const matchesQuery =
        !normalizedQuery ||
        trade.symbol.toLowerCase().includes(normalizedQuery) ||
        trade.strategyTag.toLowerCase().includes(normalizedQuery) ||
        trade.notes.toLowerCase().includes(normalizedQuery) ||
        trade.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      const matchesResult = resultFilter === "all" || trade.result === resultFilter;
      const matchesDirection = directionFilter === "all" || trade.direction === directionFilter;

      return matchesQuery && matchesResult && matchesDirection;
    });

    return next.sort((left, right) => {
      if (sortBy === "newest") return new Date(right.tradedAt || right.createdAt).getTime() - new Date(left.tradedAt || left.createdAt).getTime();
      if (sortBy === "oldest") return new Date(left.tradedAt || left.createdAt).getTime() - new Date(right.tradedAt || right.createdAt).getTime();
      if (sortBy === "bestPnl") return right.pnl - left.pnl;
      return left.pnl - right.pnl;
    });
  }, [directionFilter, query, resultFilter, sortBy, trades]);

  const updateField = (key: string, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updateEditField = (key: keyof TradeForm, value: string | boolean) => {
    setEditForm((previous) => ({ ...previous, [key]: value as never }));
  };

  const submitTrade = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      symbol: form.symbol,
      tradedAt: form.tradedAt,
      rrRatio: Number(form.rrRatio || computedRr || 0),
      entry: Number(form.entry),
      exitPrice: Number(form.exitPrice),
      stopLoss: Number(form.stopLoss),
      takeProfit: Number(form.takeProfit),
      riskPercent: Number(form.riskPercent),
      tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
    };

    const { response, data: result } = await fetchJson("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!response.ok) {
      setMessage(typeof result?.error === "string" ? result.error : "Failed to save trade");
      return;
    }

    setMessage("Trade saved successfully.");
    setForm(getInitialForm(settings));
    await loadTrades();
  };

  const removeTrade = async (id: string) => {
    await fetchJson(`/api/trades/${id}`, { method: "DELETE" });
    setSelectedTradeIds((previous) => previous.filter((value) => value !== id));
    await loadTrades();
  };

  const openEdit = (trade: Trade) => {
    setEditingTradeId(trade._id);
    setEditForm({
      symbol: trade.symbol || "NIFTY",
      tradedAt: new Date(trade.tradedAt || trade.createdAt).toISOString().slice(0, 16),
      entry: String(trade.entry),
      exitPrice: String(trade.exitPrice ?? trade.entry),
      stopLoss: String(trade.stopLoss),
      takeProfit: String(trade.takeProfit),
      direction: trade.direction,
      rrRatio: String(trade.rrRatio),
      strategyTag: trade.strategyTag || "",
      notes: trade.notes || "",
      imageUrl: trade.imageUrl || "",
      tags: trade.tags?.join(", ") || "",
      emotion: trade.emotion,
      followedPlan: trade.followedPlan,
      riskPercent: String(trade.riskPercent),
      replayNotes: trade.replayNotes || "",
    });
  };

  const cancelEdit = () => {
    setEditingTradeId(null);
    setEditForm(getInitialForm(settings));
  };

  const saveEdit = async () => {
    if (!editingTradeId) return;

    setLoading(true);
    const payload = {
      ...editForm,
      symbol: editForm.symbol,
      tradedAt: editForm.tradedAt,
      rrRatio: Number(editForm.rrRatio || editComputedRr || 0),
      entry: Number(editForm.entry),
      exitPrice: Number(editForm.exitPrice),
      stopLoss: Number(editForm.stopLoss),
      takeProfit: Number(editForm.takeProfit),
      riskPercent: Number(editForm.riskPercent),
      tags: editForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
    };

    const { response, data } = await fetchJson(`/api/trades/${editingTradeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!response.ok) {
      setMessage(typeof data?.error === "string" ? data.error : "Failed to update trade");
      return;
    }

    setMessage("Trade updated successfully.");
    cancelEdit();
    await loadTrades();
  };

  const toggleSelectedTrade = (tradeId: string) => {
    setSelectedTradeIds((previous) =>
      previous.includes(tradeId)
        ? previous.filter((id) => id !== tradeId)
        : [...previous, tradeId]
    );
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredTrades.map((trade) => trade._id);
    const allSelected = filteredIds.every((id) => selectedTradeIds.includes(id));

    if (allSelected) {
      setSelectedTradeIds((previous) => previous.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedTradeIds((previous) => Array.from(new Set([...previous, ...filteredIds])));
  };

  const deleteSelectedTrades = async () => {
    if (selectedTradeIds.length === 0) return;

    setLoading(true);
    await Promise.all(selectedTradeIds.map((id) => fetchJson(`/api/trades/${id}`, { method: "DELETE" })));
    setLoading(false);

    setSelectedTradeIds([]);
    setMessage("Selected trades deleted.");
    await loadTrades();
  };

  const exportFilteredTrades = () => {
    const header = ["date", "symbol", "direction", "rrRatio", "result", "pnl", "strategyTag", "notes", "tags"];
    const rows = filteredTrades.map((trade) => [
      new Date(trade.tradedAt || trade.createdAt).toISOString(),
      trade.symbol,
      trade.direction,
      String(trade.rrRatio),
      trade.result,
      String(trade.pnl),
      trade.strategyTag || "",
      (trade.notes || "").replaceAll("\n", " "),
      (trade.tags || []).join("|"),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (value: string) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: settings.timezone,
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return new Date(value).toLocaleString();
    }
  };

  const importCsv = async (file: File) => {
    const payload = new FormData();
    payload.append("file", file);
    const { data: result } = await fetchJson("/api/trades/import-csv", { method: "POST", body: payload });
    setMessage(`Imported ${Number(result?.imported || 0)} trades from CSV.`);
    await loadTrades();
  };

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Trade Journal</h2>
        <p className="text-sm text-slate-400">Capture every setup. Improve every week.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitTrade} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-4">
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Symbol (e.g. NIFTY, BANKNIFTY)" value={form.symbol} onChange={(event) => updateField("symbol", event.target.value.toUpperCase())} required />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" type="datetime-local" value={form.tradedAt} onChange={(event) => updateField("tradedAt", event.target.value)} required />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Entry" value={form.entry} onChange={(event) => updateField("entry", event.target.value)} required />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Exit Price" value={form.exitPrice} onChange={(event) => updateField("exitPrice", event.target.value)} required />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Stop Loss" value={form.stopLoss} onChange={(event) => updateField("stopLoss", event.target.value)} required />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Take Profit" value={form.takeProfit} onChange={(event) => updateField("takeProfit", event.target.value)} required />
              <select className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" value={form.direction} onChange={(event) => updateField("direction", event.target.value)}>
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="RR Ratio (auto)" value={form.rrRatio || computedRr} onChange={(event) => updateField("rrRatio", event.target.value)} />
              <input className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-slate-200" placeholder="Result (auto)" value={computedOutcome.result} readOnly />
              <input className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-slate-200" placeholder="P/L (auto)" value={computedOutcome.pnl} readOnly />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Risk %" value={form.riskPercent} onChange={(event) => updateField("riskPercent", event.target.value)} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Strategy tag" value={form.strategyTag} onChange={(event) => updateField("strategyTag", event.target.value)} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Tags (comma-separated)" value={form.tags} onChange={(event) => updateField("tags", event.target.value)} />
              <select className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" value={form.emotion} onChange={(event) => updateField("emotion", event.target.value)}>
                <option value="calm">Calm</option>
                <option value="confidence">Confidence</option>
                <option value="fear">Fear</option>
                <option value="greed">Greed</option>
                <option value="frustration">Frustration</option>
              </select>
            </div>

            <textarea className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Trade notes" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            <textarea className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Trade replay notes" value={form.replayNotes} onChange={(event) => updateField("replayNotes", event.target.value)} />

            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.followedPlan} onChange={(event) => updateField("followedPlan", event.target.checked)} />
              Followed trading plan
            </label>

            <div className="flex flex-wrap gap-3">
              <label className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900">
                Import CSV
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) importCsv(file);
                  }}
                />
              </label>

              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save trade"}
              </Button>
            </div>

            {form.imageUrl && <p className="text-xs text-emerald-400">Screenshot linked: {form.imageUrl}</p>}
            {message && <p className="text-sm text-slate-300">{message}</p>}
          </form>
        </CardContent>
      </Card>

      {editingTradeId && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Trade</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-4">
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Symbol (e.g. NIFTY, BANKNIFTY)" value={editForm.symbol} onChange={(event) => updateEditField("symbol", event.target.value.toUpperCase())} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" type="datetime-local" value={editForm.tradedAt} onChange={(event) => updateEditField("tradedAt", event.target.value)} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Entry" value={editForm.entry} onChange={(event) => updateEditField("entry", event.target.value)} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Exit Price" value={editForm.exitPrice} onChange={(event) => updateEditField("exitPrice", event.target.value)} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Stop Loss" value={editForm.stopLoss} onChange={(event) => updateEditField("stopLoss", event.target.value)} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Take Profit" value={editForm.takeProfit} onChange={(event) => updateEditField("takeProfit", event.target.value)} />
              <select className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" value={editForm.direction} onChange={(event) => updateEditField("direction", event.target.value as TradeForm["direction"])}>
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="RR Ratio (auto)" value={editForm.rrRatio || editComputedRr} onChange={(event) => updateEditField("rrRatio", event.target.value)} />
              <input className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-slate-200" placeholder="Result (auto)" value={editComputedOutcome.result} readOnly />
              <input className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-slate-200" placeholder="P/L (auto)" value={editComputedOutcome.pnl} readOnly />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Risk %" value={editForm.riskPercent} onChange={(event) => updateEditField("riskPercent", event.target.value)} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Strategy tag" value={editForm.strategyTag} onChange={(event) => updateEditField("strategyTag", event.target.value)} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Tags (comma-separated)" value={editForm.tags} onChange={(event) => updateEditField("tags", event.target.value)} />
              <select className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" value={editForm.emotion} onChange={(event) => updateEditField("emotion", event.target.value as TradeForm["emotion"])}>
                <option value="calm">Calm</option>
                <option value="confidence">Confidence</option>
                <option value="fear">Fear</option>
                <option value="greed">Greed</option>
                <option value="frustration">Frustration</option>
              </select>
            </div>

            <textarea className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Trade notes" value={editForm.notes} onChange={(event) => updateEditField("notes", event.target.value)} />
            <textarea className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="Trade replay notes" value={editForm.replayNotes} onChange={(event) => updateEditField("replayNotes", event.target.value)} />

            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={editForm.followedPlan} onChange={(event) => updateEditField("followedPlan", event.target.checked)} />
              Followed trading plan
            </label>

            <div className="flex flex-wrap gap-3">
              <Button onClick={saveEdit} disabled={loading}>{loading ? "Saving..." : "Update trade"}</Button>
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={toggleSelectAllFiltered}>
              {filteredTrades.every((trade) => selectedTradeIds.includes(trade._id)) && filteredTrades.length > 0
                ? "Unselect filtered"
                : "Select filtered"}
            </Button>
            <Button variant="secondary" onClick={exportFilteredTrades}>Export filtered CSV</Button>
            <Button variant="danger" onClick={deleteSelectedTrades} disabled={selectedTradeIds.length === 0 || loading}>
              Delete selected ({selectedTradeIds.length})
            </Button>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm"
              placeholder="Search symbol, strategy, notes, tags"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <select
              className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm"
              value={resultFilter}
              onChange={(event) => setResultFilter(event.target.value as "all" | Trade["result"])}
            >
              <option value="all">All results</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="breakeven">Breakeven</option>
            </select>

            <select
              className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm"
              value={directionFilter}
              onChange={(event) => setDirectionFilter(event.target.value as "all" | Trade["direction"])}
            >
              <option value="all">All directions</option>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>

            <select
              className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as "newest" | "oldest" | "bestPnl" | "worstPnl")}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="bestPnl">Best P/L first</option>
              <option value="worstPnl">Worst P/L first</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="pb-2">Select</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Direction</th>
                  <th className="pb-2">RR</th>
                  <th className="pb-2">Result</th>
                  <th className="pb-2">P/L</th>
                  <th className="pb-2">Strategy</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr key={trade._id} className="border-t border-slate-800">
                    <td className={settings.compactTables ? "py-1" : "py-2"}>
                      <input
                        type="checkbox"
                        checked={selectedTradeIds.includes(trade._id)}
                        onChange={() => toggleSelectedTrade(trade._id)}
                      />
                    </td>
                    <td className={settings.compactTables ? "py-1" : "py-2"}>{formatDateTime(trade.tradedAt || trade.createdAt)}</td>
                    <td className={settings.compactTables ? "py-1" : "py-2"}>{trade.symbol || "-"}</td>
                    <td className={settings.compactTables ? "py-1" : "py-2"}>{trade.direction}</td>
                    <td className={settings.compactTables ? "py-1" : "py-2"}>{trade.rrRatio}</td>
                    <td className={settings.compactTables ? "py-1" : "py-2"}>{trade.result}</td>
                    <td className={settings.compactTables ? "py-1" : "py-2"}>{settings.preferredCurrency} {trade.pnl}</td>
                    <td className={settings.compactTables ? "py-1" : "py-2"}>{trade.strategyTag || "-"}</td>
                    <td className={settings.compactTables ? "py-1" : "py-2"}>
                      <div className="flex gap-2">
                        <Link href={`/trade/${trade._id}`} className="text-blue-400 hover:text-blue-300">
                          View
                        </Link>
                        <button onClick={() => openEdit(trade)} className="text-emerald-400 hover:text-emerald-300">
                          Edit
                        </button>
                        <button onClick={() => removeTrade(trade._id)} className="text-rose-400 hover:text-rose-300">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTrades.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">No trades matched the current filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
