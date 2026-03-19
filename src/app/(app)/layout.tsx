import { AppShell } from "@/components/layout/app-shell";
import { env } from "@/lib/env";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell authEnabled={env.AUTH_ENABLED} demoMode={env.APP_DEMO_MODE}>
      {children}
    </AppShell>
  );
}
