import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = {
  title: "Support",
  description: "OpenLedger support — documentation, GitHub issues, and contact information.",
};

export default function SupportPage() {
  return (
    <LegalLayout title="Support">
      <section>
        <h2>Getting Help</h2>
        <p>
          OpenLedger is designed to be simple and self-explanatory, but if you run into trouble, there are several
          ways to get help.
        </p>
      </section>

      <section>
        <h2>GitHub Issues</h2>
        <p>
          Bug reports, feature requests, and questions are welcome on the{" "}
          <a href="https://github.com/sparshsam/openledger/issues" target="_blank" rel="noopener noreferrer">
            OpenLedger issue tracker
          </a>
          . Before opening a new issue, please search existing issues to see if your question has already been
        answered.
        </p>
      </section>

      <section>
        <h2>Documentation</h2>
        <p>
          The project README and CLAUDE.md in the repository contain setup instructions, architecture notes, and
          guidance for contributors. For deployment questions, refer to the Vercel documentation for Next.js
          applications.
        </p>
      </section>

      <section>
        <h2>Email Support</h2>
        <p>
          For private inquiries, you can reach the maintainer directly at{" "}
          <a href="mailto:sparshsam@gmail.com">sparshsam@gmail.com</a>. Please allow up to 48 hours for a response.
        </p>
      </section>

      <section>
        <h2>Self-Hosting</h2>
        <p>
          OpenLedger is open-source and can be self-hosted. Clone the repository, configure your environment
          variables for Supabase if desired, and deploy to any Node.js or Vercel-compatible platform. See the
          repository README for detailed instructions.
        </p>
      </section>

      <section>
        <h2>Frequently Asked Questions</h2>
        <dl className="faq-list">
          <dt>Is my data safe?</dt>
          <dd>
            Yes. In guest mode, all data stays in your browser&apos;s localStorage. Nothing is sent to any server
            unless you explicitly trigger a cloud backup.
          </dd>

          <dt>Is an account required?</dt>
          <dd>
            No. Guest mode is the default. Sign-in is entirely optional and only needed for cloud backup features.
          </dd>

          <dt>Can I import data from my bank?</dt>
          <dd>
            OpenLedger supports CSV import. Most banks offer a CSV export option. The parsing happens entirely in
            your browser — no bank login or API key is needed.
          </dd>

          <dt>How do I back up my data?</dt>
          <dd>
            Export a JSON backup from Settings &rarr; Local data &rarr; Export JSON. If signed in, you can also
            use the Cloud Backup panel to store your data on Supabase.
          </dd>

          <dt>Is OpenLedger free?</dt>
          <dd>
            Yes. OpenLedger is free, open-source software under the AGPL-3.0 license. There are no paid plans,
            subscriptions, or premium features.
          </dd>
        </dl>
      </section>
    </LegalLayout>
  );
}
