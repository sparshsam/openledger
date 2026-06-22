import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnalyticsTracker } from "@/components/analytics-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://openledger-two.vercel.app"),
  title: {
    default: "OpenLedger",
    template: "%s · OpenLedger",
  },
  description: "Money without noise. A private, local-first finance tracker for real life.",
  manifest: "/manifest.webmanifest",
  applicationName: "OpenLedger",
  authors: [{ name: "Sparsh Sam", url: "https://github.com/sparshsam" }],
  creator: "Sparsh Sam",
  publisher: "Sparsh Sam",
  category: "finance",
  keywords: [
    "OpenLedger",
    "personal finance",
    "budget tracker",
    "local-first",
    "privacy",
    "expense tracking",
    "CSV import",
    "self-hosted",
    "PWA",
    "open source",
    "money management",
    "envelope budgeting",
  ],
  appleWebApp: {
    title: "OpenLedger",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  other: {
    "apple-touch-icon": "/icons/apple-touch-icon.png",
    "apple-touch-icon-152x152": "/icons/apple-touch-icon-152x152.png",
    "apple-touch-icon-167x167": "/icons/apple-touch-icon-167x167.png",
    "apple-touch-icon-180x180": "/icons/apple-touch-icon-180x180.png",
  },
  openGraph: {
    title: "OpenLedger",
    description: "Money without noise. A private, local-first finance tracker for real life.",
    url: "https://openledger-two.vercel.app",
    siteName: "OpenLedger",
    images: [
      {
        url: "/screenshots/dashboard-desktop.png",
        width: 1440,
        height: 1000,
        alt: "OpenLedger dashboard showing summary cards, charts, and a calm local-first finance interface.",
      },
    ],
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenLedger",
    description: "Money without noise. A private, local-first finance tracker for real life.",
    images: ["/screenshots/dashboard-desktop.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <AnalyticsTracker />
      </body>
    </html>
  );
}
