"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/client-fetch";

export function DbStatusBanner() {
  const [dbUp, setDbUp] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      const { data } = await fetchJson("/api/health", { cache: "no-store" });
      const isHealthy = data?.ok === true && data?.database === "up";
      if (isMounted) {
        setDbUp(isHealthy);
      }
    };

    checkHealth();
    const intervalId = setInterval(checkHealth, 20000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (dbUp) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 text-xs text-amber-200">
      Database is offline. You can still browse UI, but data actions may fail.
    </div>
  );
}