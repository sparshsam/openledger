import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About OpenLedger — a private, editorial personal finance ledger.",
};

export default function AboutPage() {
  return (
    <>
      <PublicHeader />
      <main
        style={{
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(48px, 8vh, 80px) var(--space-lg)",
        }}
        className="narrow"
      >
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 24,
          }}
        >
          About OpenLedger
        </h1>

        <section style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              marginBottom: 16,
            }}
          >
            OpenLedger is a personal finance ledger designed for clarity, privacy, and calm.
            It is not a budgeting app. It is not accounting software. It is a place to record
            where your money came from, where it went, and what that means to you.
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              marginBottom: 16,
            }}
          >
            In a world of financial dashboards, push notifications, and gamified savings
            challenges, OpenLedger steps back. It gives you a clean page, a running balance,
            and the tools to make sense of your financial life on your own terms.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Local-first, privacy-first
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
            }}
          >
            Your data lives on your device. In guest mode, nothing ever leaves your browser.
            If you sign in with Google, you can optionally back up your ledger to the cloud —
            but every upload and deletion is manually triggered. No automatic sync, no
            background data collection, no analytics.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Free and open-source
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-secondary)",
            }}
          >
            OpenLedger is free software released under the AGPL-3.0 license. The source
            code is available on{" "}
            <a
              href="https://github.com/sparshsam/openledger"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              GitHub
            </a>
            . Built with Next.js, TypeScript, and Supabase.
          </p>
        </section>

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/account" className="pill-btn-primary">
            Get started
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
