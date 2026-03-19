"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-800/80 bg-[var(--surface-1)] p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <h1 className="text-lg font-semibold tracking-wide text-slate-100">AI Trading Journal Pro</h1>
      <p className="mt-1 text-xs text-slate-400">Premium edge analytics</p>

      <nav className="mt-6 grid gap-2">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/80",
                isActive && "bg-slate-900 text-white ring-1 ring-blue-500/30"
              )}
            >
              <Icon size={16} className={cn("opacity-90", isActive && "text-blue-300")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
