import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DayPnl = { date: string; pnl: number };

export function TradingCalendar({ data }: { data: DayPnl[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {data.slice(-28).map((item) => {
            const color = item.pnl > 0 ? "bg-emerald-500/20 border-emerald-500" : item.pnl < 0 ? "bg-rose-500/20 border-rose-500" : "bg-slate-800 border-slate-700";
            return (
              <div key={item.date} className={`rounded-md border p-2 text-xs ${color}`}>
                <p className="text-slate-400">{item.date.slice(8, 10)}</p>
                <p className="mt-1 font-medium">{item.pnl.toFixed(1)}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
