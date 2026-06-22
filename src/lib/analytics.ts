/**
 * Environment-gated analytics and crash reporting.
 *
 * Disabled by default. To enable, set NEXT_PUBLIC_ENABLE_ANALYTICS=true
 * and ensure NODE_ENV=production.
 *
 * No PII is ever collected. Only anonymized page views and error counts.
 * No localStorage, financial data, or user identifiers are tracked.
 */

type PageView = {
  path: string;
  timestamp: string;
  userAgent: string;
};

type ErrorReport = {
  message: string;
  stack: string | undefined;
  timestamp: string;
  path: string;
};

const IS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true" && process.env.NODE_ENV === "production";

function getUserAgent(): string {
  if (typeof navigator === "undefined") return "server";
  // Only collect browser family, never the full UA string
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari")) return "safari";
  if (ua.includes("Edg")) return "edge";
  return "other";
}

function getPath(): string {
  if (typeof window === "undefined") return "server";
  return window.location.pathname;
}

export function trackPageView(path?: string) {
  if (!IS_ENABLED) return;

  const event: PageView = {
    path: path ?? getPath(),
    timestamp: new Date().toISOString(),
    userAgent: getUserAgent(),
  };

  // In a production app, this would POST to a configurable endpoint.
  // Currently, the infrastructure exists but no endpoint is configured.
  if (process.env.NODE_ENV === "production") {
    console.log("[analytics] pageview", event.path);
  }
}

export function reportError(error: Error) {
  if (!IS_ENABLED) return;

  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    path: getPath(),
  };

  // Error reports are logged only. No remote endpoint is configured by default.
  if (process.env.NODE_ENV === "production") {
    console.warn("[analytics] error", report.message);
  }
}

/**
 * Return whether analytics are active (for UI display).
 */
export function isAnalyticsEnabled(): boolean {
  return IS_ENABLED;
}
