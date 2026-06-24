import Link from "next/link";

export function PublicFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "48px var(--space-lg) 40px",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 32,
        }}
      >
        <div style={{ maxWidth: 280 }}>
          <strong style={{ fontSize: 15, fontWeight: 700, display: "block", marginBottom: 6 }}>
            OpenLedger
          </strong>
          <span style={{ fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            A private, editorial personal finance ledger. Know where your money went.
          </span>
        </div>

        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/support">Support</FooterLink>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: "32px auto 0",
          paddingTop: 24,
          borderTop: "1px solid var(--border)",
          fontSize: 12,
          color: "var(--text-tertiary)",
          textAlign: "center",
        }}
      >
        OpenLedger &middot; Free &amp; open-source &middot; AGPL-3.0
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 13,
        color: "var(--text-secondary)",
        textDecoration: "none",
        transition: "color 0.15s",
      }}
    >
      {children}
    </Link>
  );
}
