// ─── Platform and Native Environment Detection ─────────────────────────────
// Detects whether the app is running natively (Capacitor/Android/Windows)
// and provides the correct API base URL for WebView routing.

export type PlatformType = "web" | "android" | "ios" | "electron" | "windows";

export type PlatformInfo = {
  platform: PlatformType;
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isElectron: boolean;
  isWeb: boolean;
  apiOrigin: string;
  apiBase: string;
  appScheme: string;
};

let cachedInfo: PlatformInfo | null = null;

/**
 * Detect the current platform.
 * Uses multiple signals because Capacitor 8 serves from https://localhost,
 * not file://, so protocol checks alone are insufficient.
 */
type CapacitorGlobal = {
  getPlatform: () => string;
  isNativePlatform?: () => boolean;
  Plugins?: Record<string, unknown>;
  registerPlugin?: (name: string) => void;
};

export function getPlatform(): PlatformType {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const url = typeof window !== "undefined" ? window.location.href : "";

  // Check for Electron
  if (ua.includes("Electron")) return "electron";

  // Check for Capacitor native
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (cap) {
    const platform = cap.getPlatform();
    if (platform === "android") return "android";
    if (platform === "ios") return "ios";
  }

  // Fallback: detect Android WebView via user agent
  if (/Android.*wv/.test(ua) || ua.includes("; wv)")) return "android";

  // Check for Windows app (custom user agent or Electron detected above)
  if (ua.includes("OpenLedgerWin")) return "windows";

  return "web";
}

/**
 * Get the production API origin for native API calls.
 * In Capacitor WebView, /api/* resolves to https://localhost/api/* instead of
 * the production domain, so we need to prepend the real origin.
 */
export function getApiOrigin(): string {
  if (typeof window === "undefined") return "https://ledger.kovina.org";
  const platform = getPlatform();
  if (platform === "web") {
    // Use the current origin in web mode (covers both dev and production)
    return window.location.origin;
  }
  return "https://ledger.kovina.org";
}

/**
 * Get the custom scheme for deep linking (e.g., "openledger://").
 */
export function getAppScheme(): string {
  return "openledger";
}

/**
 * Get comprehensive platform info for the app.
 */
export function getPlatformInfo(): PlatformInfo {
  if (cachedInfo) return cachedInfo;

  const platform = getPlatform();
  const isAndroid = platform === "android";
  const isIOS = platform === "ios";
  const isElectron = platform === "electron";
  const isWeb = platform === "web";
  const isNative = isAndroid || isIOS || isElectron;

  const apiOrigin = getApiOrigin();
  const apiBase = `${apiOrigin}/api`;
  const appScheme = getAppScheme();

  cachedInfo = { platform, isNative, isAndroid, isIOS, isElectron, isWeb, apiOrigin, apiBase, appScheme };
  return cachedInfo;
}

/**
 * Reset cached platform info (useful after dynamic platform changes).
 */
export function resetPlatformCache(): void {
  cachedInfo = null;
}

/**
 * Fetch wrapper that resolves API URLs correctly for native WebView.
 * Shows the resolved URL in error messages for debugging.
 */
export async function nativeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const info = getPlatformInfo();
  let url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  // Prepend production origin for relative API paths in native mode
  if (info.isNative && url.startsWith("/")) {
    url = `${info.apiOrigin}${url}`;
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        ...(info.isNative ? { "X-Platform": info.platform } : {}),
      },
    });
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`[nativeFetch] ${url} failed: ${msg} (platform=${info.platform}, origin=${info.apiOrigin})`);
  }
}
