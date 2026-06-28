"use client";

import { useState, useEffect, useCallback } from "react";

export type DeepLink = {
  url: string;
  path: string;
  queryParams: Record<string, string>;
};

/**
 * Hook that listens for deep links via Capacitor's appUrlOpen event.
 * Falls back to no-op in web mode.
 */
export function useDeepLink() {
  const [lastLink, setLastLink] = useState<DeepLink | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handler = await App.addListener("appUrlOpen", (data) => {
          const url = data.url;
          if (!url) return;

          const parsed = new URL(url);
          const link: DeepLink = {
            url,
            path: parsed.pathname,
            queryParams: Object.fromEntries(parsed.searchParams.entries()),
          };

          setLastLink(link);

          if (link.path.includes("auth/callback")) {
            if (typeof window !== "undefined") {
              window.location.href = url;
            }
          }
        });
        cleanup = () => { handler.remove(); };
      } catch {
        // Capacitor not available — web mode
      }
    };

    setup();

    return () => {
      cleanup?.();
    };
  }, []);

  const clearLink = useCallback(() => setLastLink(null), []);

  return { lastLink, clearLink };
}
