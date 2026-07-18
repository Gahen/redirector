import { readFileSync } from "fs";
import path from "path";

// Cached on first load per server instance (cold start model on Vercel).
let blacklist: string[] | null = null;

function loadBlacklist(): string[] {
  if (blacklist) return blacklist;
  const filePath = path.join(process.cwd(), "blacklist.txt");
  let raw = "";
  try {
    raw = readFileSync(filePath, "utf8");
  } catch {
    blacklist = [];
    return blacklist;
  }
  blacklist = raw
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  return blacklist;
}

// Dev convenience: drop the in-memory cache so edits to blacklist.txt
// are seen without restart. Safe no-op when not in dev.
export function resetBlacklistCache(): void {
  blacklist = null;
}

// host: lowercased hostname (no port, no scheme) — e.g. "sub.example.com".
// Returns true if host matches any blacklist entry under suffix rules.
export function isBlacklistedHost(host: string): boolean {
  const h = host.toLowerCase();
  const list = loadBlacklist();
  for (const line of list) {
    if (h === line) return true;
    if (h.endsWith("." + line)) return true;
  }
  return false;
}

// Build a parsed URL with an http(s) scheme for testing/matching convenience.
export function isBlacklistedUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  const h = parsed.hostname.toLowerCase();
  if (!h) return false;
  return isBlacklistedHost(h);
}
