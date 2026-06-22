import Link from "next/link";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="legal-page">
      <a href="#legal-main" className="skip-link">
        Skip to main content
      </a>
      <header className="legal-header">
        <Link href="/" className="legal-brand">
          <div className="brand-mark">
            <FileText size={18} aria-hidden />
          </div>
          <div>
            <p>OpenLedger</p>
            <span>Money without noise.</span>
          </div>
        </Link>
      </header>

      <main className="legal-content" id="legal-main">
        <h1>{title}</h1>
        <div className="legal-body">{children}</div>
      </main>

      <footer className="legal-footer">
        <nav aria-label="Legal navigation">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
          <a href="https://github.com/sparshsam/openledger" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
        <p>OpenLedger is free, open-source, and local-first. No data is collected or shared.</p>
      </footer>
    </div>
  );
}
