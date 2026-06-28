// ─── Native Google Sign-In via In-App Browser ─────────────────────────────
// Uses @capacitor/browser to open Google OAuth in a Chrome Custom Tab
// (stays in-app) and handles the callback via deep link.
//
// Manual steps for the app owner:
//   1. Add 'openledger://auth/callback' to Supabase Auth settings (Allowed redirect URLs)
//   2. DO NOT add the custom scheme to Google Cloud OAuth — it only accepts https://
//   3. Supabase sits in the middle and handles the translation

import { getPlatformInfo } from "./platform";

/**
 * Generate the Supabase Google OAuth URL for in-app browser.
 */
export function getGoogleOAuthUrl(): string {
  const info = getPlatformInfo();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qoxmibmbyjmkntzrckyr.supabase.co";
  const redirectTo = `${info.appScheme}://auth/callback`;

  // Build the Supabase OAuth URL with skipBrowserRedirect
  // This returns the Google OAuth URL directly so we can open it in-app
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: redirectTo,
    skipBrowserRedirect: "true",
    flowType: "pkce",
  });

  return `${supabaseUrl}/auth/v1/authorize?${params.toString()}`;
}

/**
 * Open Google sign-in in an in-app browser tab.
 * Returns true if the native browser was opened, false if falling back to web.
 */
export async function signInWithGoogleNative(): Promise<boolean> {
  try {
    const { Browser } = await import("@capacitor/browser");
    const url = getGoogleOAuthUrl();
    await Browser.open({ url });
    return true;
  } catch {
    return false;
  }
}

/**
 * Listen for the OAuth callback from the in-app browser.
 * Call this on app startup to handle the redirect back.
 */
export async function listenForAuthCallback(
  onCode: (code: string) => void,
): Promise<() => void> {
  try {
    const { App } = await import("@capacitor/app");
    const handler = await App.addListener("appUrlOpen", (data) => {
      const url = data.url;
      if (!url?.includes("auth/callback")) return;

      // Extract the authorization code from the URL
      const parsed = new URL(url);
      const code = parsed.searchParams.get("code");
      if (code) {
        onCode(code);
      }
    });
    return handler.remove;
  } catch {
    // Capacitor not available — no-op
    return () => {};
  }
}
