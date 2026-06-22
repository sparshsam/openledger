"use client";

import { useEffect } from "react";
import { trackPageView, isAnalyticsEnabled } from "@/lib/analytics";

/**
 * Client-side analytics tracker.
 * Renders nothing. Tracks page views when analytics are enabled.
 * Only active when NEXT_PUBLIC_ENABLE_ANALYTICS=true and NODE_ENV=production.
 */
export function AnalyticsTracker() {
  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    trackPageView();
  }, []);

  return null;
}
