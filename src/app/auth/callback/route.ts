import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  console.log("[AUTH/CALLBACK] Request received:", {
    path: requestUrl.pathname,
    hasCode: !!code,
    origin,
  });

  if (code) {
    const redirectResponse = NextResponse.redirect(`${origin}/app`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = request.cookies.getAll();
            console.log("[AUTH/CALLBACK] Cookies read:", cookies.length, "cookies");
            return cookies;
          },
          setAll(cookiesToSet) {
            console.log("[AUTH/CALLBACK] Writing", cookiesToSet.length, "cookies");
            for (const { name, value, options } of cookiesToSet) {
              console.log("[AUTH/CALLBACK] Set-Cookie:", name, {
                valueLen: value?.length ?? 0,
                path: options?.path,
                maxAge: options?.maxAge,
                sameSite: options?.sameSite,
              });
              redirectResponse.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    console.log("[AUTH/CALLBACK] Calling exchangeCodeForSession...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[AUTH/CALLBACK] exchangeCodeForSession result:", {
      hasSession: !!data?.session,
      hasUser: !!data?.session?.user,
      userId: data?.session?.user?.id?.substring(0, 12),
      hasAccessToken: !!data?.session?.access_token,
      hasRefreshToken: !!data?.session?.refresh_token,
      error: error?.message,
    });

    if (error) {
      console.error("[AUTH/CALLBACK] Exchange failed:", error.message);
      return NextResponse.redirect(`${origin}/?auth_error=${error.message}`);
    }

    console.log("[AUTH/CALLBACK] Redirecting to /app with cookies");
    return redirectResponse;
  }

  console.log("[AUTH/CALLBACK] No code in request");
  return NextResponse.redirect(`${origin}/?auth_error=callback_failed`);
}
