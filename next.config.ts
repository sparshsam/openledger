import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      // ── Security headers for ALL routes ──
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://*.supabase.co",
              "manifest-src 'self'",
              "font-src 'self' data:",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },

      // ── HTML page routes — PREVENT CDN CACHING ──
      // This is the critical fix: without this, Vercel caches HTML pages
      // at the CDN edge for up to a year, serving stale content to every visitor.
      // The regex excludes known static asset paths so their caching is unaffected.
      {
        source:
          "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|json|wasm|woff2?)$).*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "private, no-cache, no-store, max-age=0, must-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },

      // ── Next.js content-hashed JS/CSS — IMMUTABLE CACHING ──
      // These filenames include a content hash, so they can be cached forever.
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
