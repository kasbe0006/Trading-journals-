"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

type Item = { bucket: string; count: number };

export function RRChart({ data }: { data: Item[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-64 w-full" />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="bucket" outerRadius={90} label>
            {data.map((entry, index) => (
              <Cell key={entry.bucket} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
