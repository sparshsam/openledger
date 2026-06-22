import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "OpenLedger terms of service — free, open-source personal finance software.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p className="legal-updated">Last updated: June 21, 2026</p>

      <section>
        <h2>Acceptance of Terms</h2>
        <p>
          By using OpenLedger, you agree to these terms. If you do not agree, do not use the application.
        </p>
      </section>

      <section>
        <h2>License</h2>
        <p>
          OpenLedger is free, open-source software released under the{" "}
          <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">
            GNU Affero General Public License v3.0 (AGPL-3.0)
          </a>
          . You may use, modify, and distribute it under the terms of that license.
        </p>
      </section>

      <section>
        <h2>No Financial Advice</h2>
        <p>
          OpenLedger is a tool for tracking and organising your financial records. It does not provide financial,
          investment, legal, or tax advice. You are solely responsible for your financial decisions.
        </p>
      </section>

      <section>
        <h2>No Warranty</h2>
        <p>
          OpenLedger is provided &ldquo;as is&rdquo; without warranty of any kind, express or implied. The authors
          are not liable for any damages arising from its use. You use the software at your own risk.
        </p>
      </section>

      <section>
        <h2>Data Responsibility</h2>
        <p>
          You are responsible for maintaining backups of your data. OpenLedger provides JSON export/import tools and
          optional cloud backup, but these are convenience features, not guarantees. The authors are not responsible
          for data loss resulting from browser storage clearing, failed backups, or user error.
        </p>
      </section>

      <section>
        <h2>Service Availability</h2>
        <p>
          OpenLedger runs primarily in your browser. The hosted version on Vercel may experience downtime for
          maintenance or unforeseen issues. No uptime guarantee is provided. The open-source codebase can be
          self-hosted independently at any time.
        </p>
      </section>

      <section>
        <h2>User Conduct</h2>
        <p>
          You agree not to use OpenLedger for any unlawful purpose or in violation of any applicable laws or
          regulations.
        </p>
      </section>

      <section>
        <h2>Changes to Terms</h2>
        <p>
          These terms may be updated from time to time. Continued use after changes constitutes acceptance of the
          revised terms. Material changes will be noted by updating the &ldquo;Last updated&rdquo; date.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions about these terms, email{" "}
          <a href="mailto:sparshsam@gmail.com">sparshsam@gmail.com</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
