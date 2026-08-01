"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError(data.error ?? "Could not send recovery email.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 5000);
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "72px 20px 40px", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Reset password</h1>
      <p style={{ marginTop: 0, color: "#5b6b72", fontSize: 15 }}>
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || success}
          aria-label="Email"
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
          {loading ? "Sending..." : "Send recovery link"}
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
          Recovery email sent! Check your inbox. Redirecting to sign in...
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
