import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import type { ReactNode } from "react";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main
        id="legal-main"
        style={{
          width: "100%",
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(40px, 6vh, 64px) var(--space-lg) clamp(48px, 6vh, 72px)",
        }}
        className="narrow"
      >
        <h1
          style={{
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 24,
          }}
        >
          {title}
        </h1>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--text-secondary)",
          }}
        >
          {children}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
