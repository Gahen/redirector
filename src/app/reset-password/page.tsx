"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const supabase = getBrowserClient();

      const { data, error: exchangeError } = await supabase.auth.getSession();
      if (exchangeError) {
        setError(exchangeError.message);
        setChecking(false);
        return;
      }

      if (!data.session) {
        router.push("/forgot-password");
        return;
      }

      setChecking(false);
    }

    init();
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getBrowserClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      window.location.href = "/login";
    }, 3000);
  }

  if (checking) {
    return (
      <main style={{ maxWidth: 400, margin: "0 auto", padding: "72px 20px 40px", minHeight: "100vh" }}>
        <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Reset password</h1>
        <p style={{ marginTop: 0, color: "#5b6b72", fontSize: 15 }}>Verifying recovery link...</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "72px 20px 40px", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Set new password</h1>
      <p style={{ marginTop: 0, color: "#5b6b72", fontSize: 15 }}>
        Enter a new password for your account.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <input
          type="password"
          placeholder="New password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading || success}
          aria-label="New password"
          style={{
            padding: "10px 12px",
            fontSize: 15,
            border: "1px solid #d4d9dd",
            borderRadius: 8,
            background: "#fff",
            color: "#11181c",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || success}
          style={{
            padding: "10px 18px",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            background: loading || success ? "#9bb6ed" : "#2f6feb",
            color: "#fff",
            cursor: loading || success ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "#fdecec",
            color: "#a32626",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "#eaf6ee",
            color: "#1d7a3a",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          Password updated! Redirecting to sign in...
        </p>
      )}

      <p style={{ marginTop: 16, fontSize: 14, color: "#5b6b72" }}>
        <Link href="/login" style={{ color: "#2f6feb", textDecoration: "none" }}>
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
