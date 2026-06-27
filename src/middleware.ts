import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ── PKCE auth code catch ──
  // If the request has a ?code= in the query string (PKCE auth code from OAuth)
  // but is NOT already at /app, rewrite to /app so the client-side useAuth
  // hook can exchange the code. We use rewrite (not redirect) because the
  // service worker's fetch() follows redirects automatically, swallowing the
  // redirect chain and leaving ?code= in the URL without ever navigating to
  // /app. The client-side exchange accesses the PKCE code verifier cookie
  // directly and sets session cookies correctly via document.cookie.
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code && pathname !== "/app") {
    const appUrl = new URL("/app", request.url);
    appUrl.search = searchParams.toString();
    return NextResponse.rewrite(appUrl);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();

  // Prevent CDN from caching HTML pages — ensures users always see the latest
  // build. Without this, Vercel's CDN can serve stale HTML for up to a year.
  supabaseResponse.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate",
  );

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
