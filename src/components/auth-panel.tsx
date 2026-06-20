"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type AuthPanelProps = {
  user: User | null;
  profile: { display_name: string | null; email: string | null; avatar_url: string | null } | null;
  onSignOut: () => void;
};

export function AuthPanel({ user, profile, onSignOut }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleEmailOtp = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError("");
    setSent(false);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setSending(false);
  };

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onSignOut();
  };

  // Signed-in state
  if (user) {
    return (
      <div className="auth-signed-in">
        <div className="auth-profile">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="auth-avatar" />
          ) : (
            <div className="auth-avatar-placeholder">
              {(profile?.display_name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <strong>{profile?.display_name ?? "User"}</strong>
            <span className="auth-email">{profile?.email ?? user.email}</span>
          </div>
        </div>
        <span className="auth-badge">Cloud-ready</span>
        <button className="auth-sign-out" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    );
  }

  // Guest state
  return (
    <div className="auth-guest">
      <div className="auth-mode-label">
        <span className="status-dot" />
        <strong>Guest mode</strong>
        <span className="auth-badge guest">Local-only</span>
      </div>

      {sent ? (
        <p className="auth-success">
          Check <strong>{email}</strong> for a sign-in link. It expires in 10 minutes.
        </p>
      ) : (
        <>
          <div className="auth-email-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === "Enter" && handleEmailOtp()}
            />
            <button onClick={handleEmailOtp} disabled={sending || !email.trim()}>
              {sending ? "Sending..." : "Send sign-in link"}
            </button>
          </div>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button className="auth-google-btn" onClick={handleGoogleSignIn}>
            <GoogleIcon />
            Continue with Google
          </button>
        </>
      )}

      {error ? <p className="gentle-error">{error}</p> : null}

      <p className="gentle-help">
        Signing in prepares your account for future cloud sync. Your local ledger data stays in this browser.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
