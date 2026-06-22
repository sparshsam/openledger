"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/analytics";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--graphite)] text-[var(--ink)] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold mb-3" style={{ fontFamily: "Georgia, serif" }}>
          Something went wrong
        </h1>
        <p className="text-[var(--muted)] text-sm mb-6 leading-relaxed">
          OpenLedger encountered an unexpected error. No data has been lost — your local ledger is
          safe in your browser.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md border border-[var(--line-dark)] bg-[var(--graphite-2)] text-[var(--ink)] text-sm cursor-pointer hover:bg-[var(--line-dark)]"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 rounded-md border border-[var(--sage)] text-[var(--sage)] text-sm cursor-pointer hover:bg-[var(--sage)] hover:text-[var(--graphite)]"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
