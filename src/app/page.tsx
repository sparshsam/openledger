import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <PublicHeader />
      <main
        style={{
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 var(--space-lg)",
        }}
      >
        <section
          style={{
            paddingTop: "clamp(64px, 12vh, 120px)",
            paddingBottom: "clamp(48px, 8vh, 80px)",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 640,
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            Know where your money went.
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              maxWidth: 520,
              marginTop: 24,
              marginBottom: 0,
            }}
          >
            OpenLedger is a personal ledger — not budgeting software, not
            accounting software. A private, calm place to record and review your
            financial life.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
            <Link href="/account" className="pill-btn-primary">
              Get started
            </Link>
            <Link href="/about" className="pill-btn-secondary">
              Learn more
            </Link>
          </div>
        </section>

        <section
          style={{
            paddingTop: "clamp(48px, 6vh, 72px)",
            paddingBottom: "clamp(48px, 6vh, 72px)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            <PrincipleBlock
              number="01"
              title="A ledger, not a dashboard"
              text="OpenLedger is a place to record transactions, track accounts, and review your financial story. No charts, no forecasts, no gamification. Just a clear, calm record."
            />
            <PrincipleBlock
              number="02"
              title="Privacy by design"
              text="Your data lives on your device. In guest mode, nothing leaves your browser. Sign in with Google to enable optional cloud backup — you control every upload and deletion."
            />
            <PrincipleBlock
              number="03"
              title="Local-first, cloud optional"
              text="Start instantly without an account. All features work offline. If you want cloud backup or multi-device access later, a Google account adds those capabilities."
            />
          </div>
        </section>

        <section
          style={{
            paddingTop: "clamp(48px, 6vh, 72px)",
            paddingBottom: "clamp(64px, 8vh, 96px)",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 480,
              margin: "0 auto",
              color: "var(--text-primary)",
            }}
          >
            Your financial life, on your terms.
          </h2>
          <div style={{ marginTop: 24 }}>
            <Link href="/account" className="pill-btn-primary">
              Get started
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function PrincipleBlock({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <span
        style={{
          fontSize: "clamp(40px, 5vw, 64px)",
          fontWeight: 900,
          lineHeight: 1,
          color: "var(--accent)",
          flexShrink: 0,
          minWidth: 64,
        }}
      >
        {number}
      </span>
      <div>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 8px",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            maxWidth: 520,
            margin: 0,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
