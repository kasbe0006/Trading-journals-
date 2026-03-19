"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DbStatusBanner } from "@/components/layout/db-status-banner";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: React.ReactNode;
  authEnabled: boolean;
  demoMode: boolean;
};

export function AppShell({ children, authEnabled, demoMode }: AppShellProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const modeLabel = authEnabled ? "Auth enabled" : demoMode ? "Demo mode enabled" : "Open mode";

  const goDashboard = () => {
    router.push("/dashboard");
    router.refresh();
  };

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-slate-100 md:flex">
      <Sidebar />
      <main className="flex-1">
        <DbStatusBanner />
        <header className="flex items-center justify-between border-b border-slate-800/80 bg-[linear-gradient(180deg,rgba(20,33,58,0.55),rgba(12,19,34,0.82))] px-6 py-4">
          <p className="text-sm text-slate-400">Institutional-grade trade intelligence</p>
          <div className="flex items-center gap-2">
            <p className="hidden text-xs text-amber-300 sm:block">{modeLabel}</p>
            <Button variant="secondary" onClick={goDashboard}>
              Dashboard
            </Button>
            {authEnabled && (
              <Button variant="secondary" onClick={logout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            )}
          </div>
        </header>
        <section className="bg-[radial-gradient(circle_at_20%_-5%,rgba(59,130,246,0.07),transparent_30%)] p-6">{children}</section>
      </main>
    </div>
  );
}
