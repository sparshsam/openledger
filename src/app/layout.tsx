import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quietledger.vercel.app"),
  title: {
    default: "OpenLedger",
    template: "%s · OpenLedger",
  },
  description: "Money without noise. A private, local-first finance tracker for real life.",
  manifest: "/manifest.webmanifest",
  applicationName: "OpenLedger",
  authors: [{ name: "Sparsh Sam", url: "https://github.com/sparshsam" }],
  creator: "Sparsh Sam",
  keywords: [
    "OpenLedger",
    "personal finance",
    "local-first",
    "privacy",
    "CSV import",
    "self-hosted",
    "PWA",
  ],
  appleWebApp: {
    title: "OpenLedger",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon.svg",
  },
  openGraph: {
    title: "OpenLedger",
    description: "Money without noise. A private, local-first finance tracker for real life.",
    url: "https://quietledger.vercel.app",
    siteName: "OpenLedger",
    images: [
      {
        url: "/screenshots/dashboard-desktop.png",
        width: 1440,
        height: 1000,
        alt: "OpenLedger dashboard showing a calm local-first personal finance ledger.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
