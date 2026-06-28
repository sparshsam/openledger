// ─── Native Google Sign-In via In-App Browser ─────────────────────────────
// Uses @capacitor/browser (Chrome Custom Tab) to open Google OAuth in-app,
// then handles the callback via a custom scheme deep link.
//
// Flow:
//   1. Call signInWithGoogleNative() → builds Supabase OAuth URL with
//      skipBrowserRedirect:true and a custom scheme redirect
//   2. Opens URL in Chrome Custom Tab via Browser.open()
//   3. User signs in on Google
//   4. Google redirects to openledger://auth/callback?code=...
//   5. Capacitor App detects the deep link via appUrlOpen
//   6. listenForAuthCallback extracts the code and calls exchangeCodeForSession
//
// Manual steps for the app owner:
//   1. Add 'openledger://auth/callback' to Supabase Auth settings (Allowed redirect URLs)
//   2. DO NOT add the custom scheme to Google Cloud OAuth — it only accepts https://
//   3. Supabase sits in the middle and handles the translation

import { createClient } from "@supabase/supabase-js";
import { getPlatformInfo } from "./platform";

// Create a temporary Supabase client for native OAuth — uses the same
// project URL and publishable key as the web client.
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured for native sign-in");
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      autoRefreshToken: true,
    },
  });
}

/**
 * Open Google sign-in in an in-app Chrome Custom Tab.
 * Returns the PKCE authorization URL that was opened, or null if Capacitor
 * is not available (caller should fall back to web-based sign-in).
 */
export async function signInWithGoogleNative(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const info = getPlatformInfo();
    const redirectTo = `${info.appScheme}://auth/callback`;

    // Get the OAuth URL from Supabase with PKCE flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error || !data?.url) {
      console.error("[nativeSignIn] Failed to create OAuth URL:", error?.message);
      return null;
    }

    // Open the URL in an in-app browser tab
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: data.url });

    return data.url;
  } catch (err) {
    console.error("[nativeSignIn] Error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Listen for the OAuth callback from the in-app browser via deep link.
 * Extracts the authorization code and exchanges it with Supabase.
 * Returns the callback's cleanup function.
 */
export async function listenForAuthCallback(
  onSuccess?: () => void,
  onError?: (message: string) => void,
): Promise<() => void> {
  try {
    const { App } = await import("@capacitor/app");
    const supabase = getSupabaseClient();

    const handler = await App.addListener("appUrlOpen", async (data) => {
      const url = data.url;
      if (!url?.includes("auth/callback")) return;

      // Parse the callback URL to extract the authorization code
      let code: string | null = null;

      try {
        const parsed = new URL(url);
        code = parsed.searchParams.get("code");
      } catch {
        // URL parsing might fail for custom schemes on some platforms
        const match = url.match(/[?&]code=([^&]+)/);
        code = match ? decodeURIComponent(match[1]) : null;
      }

      if (!code) {
        console.error("[nativeSignIn] No authorization code in callback URL:", url);
        onError?.("No authorization code received from Google sign-in.");
        return;
      }

      // Exchange the PKCE code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[nativeSignIn] Code exchange failed:", error.message);
        onError?.(error.message);
        return;
      }

      console.log("[nativeSignIn] Session established successfully");
      onSuccess?.();
    });

    return () => { handler.remove(); };
  } catch (err) {
    console.error("[nativeSignIn] Failed to set up auth listener:", err);
    return () => {};
  }
}
