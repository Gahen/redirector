"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type Status = "idle" | "loading" | "success" | "error";

type ShortenResponse = {
  code: string;
  shortUrl: string;
  reused?: boolean;
};

const ERROR_MESSAGES: Record<string, string> = {
  domain_blacklisted: "This domain is not allowed.",
  invalid_url: "Please enter a valid http(s) URL.",
  invalid_json: "Please enter a valid http(s) URL.",
  code_generation_failed: "Could not generate a short URL. Please try again.",
  auth_required: "You must be signed in to use a custom path.",
  invalid_path_length: "Custom path must be 3-15 characters.",
  invalid_path_chars: "Custom path can only contain letters, numbers, hyphens, and underscores.",
  path_reserved: "This path is reserved.",
  path_taken: "This path is already taken.",
};

const DEFAULT_ERROR = "Something went wrong. Please try again.";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [customPath, setCustomPath] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ShortenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if ((data as { authenticated?: boolean }).authenticated) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setResult(null);
    setError(null);
    setCopied(false);
    setQrDataUrl(null);

    try {
      const body: Record<string, string> = { url };
      if (customPath.trim()) {
        body.path = customPath.trim();
      }

      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as ShortenResponse & { error?: string };

      if (!res.ok) {
        setStatus("error");
        setError(ERROR_MESSAGES[data.error ?? ""] ?? DEFAULT_ERROR);
        return;
      }

      setStatus("success");
      setResult(data);

      const shortUrl = data.shortUrl;
      try {
        const dataUrl = await QRCode.toDataURL(shortUrl);
        setQrDataUrl(dataUrl);
      } catch {
        // QR generation failed, non-critical
      }
    } catch {
      setStatus("error");
      setError(DEFAULT_ERROR);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleDownloadQr() {
    if (!qrDataUrl || !result) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${result.code}.png`;
    link.click();
  }

  const isLoading = status === "loading";

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "72px 20px 40px",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>px.ar</h1>
        <div style={{ display: "flex", gap: 12 }}>
          {isLoggedIn ? (
            <Link href="/dashboard" style={{ color: "#2f6feb", textDecoration: "none", fontSize: 14 }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ color: "#2f6feb", textDecoration: "none", fontSize: 14 }}>
                Sign in
              </Link>
              <Link href="/register" style={{ color: "#2f6feb", textDecoration: "none", fontSize: 14 }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      <p style={{ marginTop: 0, color: "#5b6b72", fontSize: 15 }}>
        Paste a long URL to get a short one.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="url"
            inputMode="url"
            placeholder="https://example.com/very/long/url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isLoading}
            aria-label="URL to shorten"
            style={{
              flex: 1,
              padding: "10px 12px",
              fontSize: 15,
              border: "1px solid #d4d9dd",
              borderRadius: 8,
              background: "#fff",
              color: "#11181c",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#4f8df7")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#d4d9dd")}
          />
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            aria-label="Shorten"
            style={{
              padding: "10px 18px",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              borderRadius: 8,
              background: isLoading ? "#9bb6ed" : "#2f6feb",
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minWidth: 96,
              justifyContent: "center",
            }}
          >
            {isLoading && <Spinner />}
            {isLoading ? "Shortening" : "Shorten"}
          </button>
        </div>

        {isLoggedIn && (
          <input
            type="text"
            placeholder="Custom path (optional, 3-15 chars)"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value.replace(/[^A-Za-z0-9_-]/g, ""))}
            disabled={isLoading}
            aria-label="Custom path"
            style={{
              padding: "10px 12px",
              fontSize: 14,
              border: "1px solid #d4d9dd",
              borderRadius: 8,
              background: "#fff",
              color: "#11181c",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#4f8df7")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#d4d9dd")}
          />
        )}
      </form>

      {!isLoggedIn && (
        <p style={{ marginTop: 12, fontSize: 13, color: "#9aa5ab" }}>
          Anonymous links expire after 3 months.{" "}
          <Link href="/register" style={{ color: "#2f6feb", textDecoration: "none" }}>
            Create an account
          </Link>{" "}
          for permanent links.
        </p>
      )}

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

      {status === "success" && result && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "#fff",
            border: "1px solid #e3e8ec",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: "#5b6b72",
                marginBottom: 4,
              }}
            >
              Your short URL
            </div>
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#2f6feb",
                textDecoration: "none",
                wordBreak: "break-all",
              }}
            >
              {result.shortUrl}
            </a>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleCopy}
              disabled={copied}
              style={{
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid #d4d9dd",
                borderRadius: 8,
                background: copied ? "#eaf6ee" : "#fff",
                color: copied ? "#1d7a3a" : "#11181c",
                cursor: copied ? "default" : "pointer",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {qrDataUrl && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR Code for ${result.shortUrl}`} style={{ width: 160, height: 160 }} />
              <button
                type="button"
                onClick={handleDownloadQr}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 8,
                  background: "#2f6feb",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Download QR
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 14,
        height: 14,
        border: "2px solid rgba(255,255,255,0.5)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        display: "inline-block",
        animation: "pxspin 0.7s linear infinite",
      }}
    />
  );
}
