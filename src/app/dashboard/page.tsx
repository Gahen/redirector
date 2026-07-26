"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

type Entry = {
  id: string;
  code: string;
  url: string;
  created_at: string;
};

export default function DashboardPage() {
  const [urls, setUrls] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const router = useRouter();

  async function loadUrls() {
    const res = await fetch("/api/urls");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setError("Failed to load URLs.");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { urls: Entry[] };
    setUrls(data.urls);
    setLoading(false);
  }

  useEffect(() => {
    loadUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/urls/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Failed to delete URL.");
      return;
    }
    setUrls((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleShowQr(code: string) {
    setSelectedCode(code);
    if (qrDataUrl && selectedCode === code) {
      setQrDataUrl(null);
      setSelectedCode(null);
      return;
    }
    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/${code}`;
    try {
      const dataUrl = await QRCode.toDataURL(shortUrl);
      setQrDataUrl(dataUrl);
      setSelectedCode(code);
    } catch {
      setError("Failed to generate QR code.");
    }
  }

  async function handleDownloadQr(code: string) {
    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/${code}`;
    try {
      const dataUrl = await QRCode.toDataURL(shortUrl);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `qr-${code}.png`;
      link.click();
    } catch {
      setError("Failed to download QR code.");
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "72px 20px 40px", minHeight: "100vh" }}>
        <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Dashboard</h1>
        <p style={{ color: "#5b6b72" }}>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "72px 20px 40px", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Dashboard</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/" style={{ color: "#2f6feb", textDecoration: "none", fontSize: 14 }}>
            New URL
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              padding: "6px 12px",
              fontSize: 14,
              fontWeight: 600,
              border: "1px solid #d4d9dd",
              borderRadius: 8,
              background: "#fff",
              color: "#11181c",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            padding: "8px 12px",
            background: "#fdecec",
            color: "#a32626",
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}

      {urls.length === 0 ? (
        <p style={{ color: "#5b6b72" }}>
          You haven&apos;t created any short URLs yet.{" "}
          <Link href="/" style={{ color: "#2f6feb", textDecoration: "none" }}>
            Create one
          </Link>
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {urls.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: 16,
                background: "#fff",
                border: "1px solid #e3e8ec",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 4 }}>
                  <a
                    href={`/${entry.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 16, fontWeight: 600, color: "#2f6feb", textDecoration: "none" }}
                  >
                    {process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/{entry.code}
                  </a>
                </div>
                <div style={{ fontSize: 13, color: "#5b6b72", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.url}
                </div>
                <div style={{ fontSize: 12, color: "#9aa5ab", marginTop: 2 }}>
                  Created {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleShowQr(entry.code)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid #d4d9dd",
                    borderRadius: 8,
                    background: "#fff",
                    color: "#11181c",
                    cursor: "pointer",
                  }}
                >
                  QR
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid #d4d9dd",
                    borderRadius: 8,
                    background: "#fff",
                    color: "#a32626",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {qrDataUrl && selectedCode && (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: "#fff",
            border: "1px solid #e3e8ec",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, color: "#5b6b72", marginBottom: 4 }}>
            QR Code for /{selectedCode}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt={`QR Code for /${selectedCode}`} style={{ width: 200, height: 200 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleDownloadQr(selectedCode)}
              style={{
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                borderRadius: 8,
                background: "#2f6feb",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Download PNG
            </button>
            <button
              onClick={() => { setQrDataUrl(null); setSelectedCode(null); }}
              style={{
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid #d4d9dd",
                borderRadius: 8,
                background: "#fff",
                color: "#11181c",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
