import { AppShell } from "@/components/layout/app-shell";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/server-auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <AppShell authEnabled={env.AUTH_ENABLED} demoMode={env.APP_DEMO_MODE}>
      {children}
    </AppShell>
  );
}
