"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError(data.error ?? "Sign in failed.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "72px 20px 40px", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Sign in</h1>
      <p style={{ marginTop: 0, color: "#5b6b72", fontSize: 15 }}>
        Sign in to manage your short URLs.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          aria-label="Password"
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
          disabled={loading}
          style={{
            padding: "10px 18px",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            background: loading ? "#9bb6ed" : "#2f6feb",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
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

      <p style={{ marginTop: 16, fontSize: 14, color: "#5b6b72" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#2f6feb", textDecoration: "none" }}>
          Sign up
        </Link>
      </p>
    </main>
  );
}
