import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  helper,
  tone = "neutral",
}: {
  title: string;
  value: string | number;
  helper?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <Card className="kpi-glow">
      <CardHeader>
        <CardTitle className="text-slate-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
        {helper && (
          <p
            className={cn(
              "mt-1 text-xs",
              tone === "positive" && "text-emerald-400",
              tone === "negative" && "text-rose-400",
              tone === "neutral" && "text-slate-500"
            )}
          >
            {helper}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
