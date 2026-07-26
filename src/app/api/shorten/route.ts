import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, UrlRow } from "@/lib/supabase-clients";
import { isBlacklistedHost } from "@/lib/blacklist";
import { generateCode } from "@/lib/code";
import { isReservedCode } from "@/lib/reserved";
import { createClient } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_CODE_ATTEMPTS = 5;
const ANON_EXPIRY_MONTHS = 3;
const CUSTOM_PATH_MIN = 3;
const CUSTOM_PATH_MAX = 15;
const CUSTOM_PATH_RE = /^[A-Za-z0-9_-]+$/;

type Problem = { error: string };

function badStatus(code: number, error: string) {
  return NextResponse.json<Problem>({ error }, { status: code });
}

function isValidHttpUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  if (!host) return null;
  return parsed;
}

async function findExistingCodeByUrl(url: string): Promise<string | null> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("urls")
    .select("code")
    .eq("url", url)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as Pick<UrlRow, "code"> | null)?.code ?? null;
}

async function findExistingCode(code: string): Promise<boolean> {
  const client = getServiceClient();
  const { data, error } = await client
    .from("urls")
    .select("code")
    .eq("code", code)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

function getExpiryDate(): string | null {
  const date = new Date();
  date.setMonth(date.getMonth() + ANON_EXPIRY_MONTHS);
  return date.toISOString();
}

async function insertCode(
  code: string,
  url: string,
  ownerId: string | null,
  expiresAt: string | null,
): Promise<boolean> {
  const client = getServiceClient();
  const { error } = await client.from("urls").insert({ code, url, owner_id: ownerId, expires_at: expiresAt });
  if (!error) return true;
  if (error.code === "23505") return false;
  return false;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badStatus(400, "invalid_json");
  }

  const rawUrl = typeof body === "object" && body && "url" in body
    ? String((body as { url: unknown }).url)
    : "";

  const customPath = typeof body === "object" && body && "path" in body
    ? String((body as { path: unknown }).path)
    : null;

  const parsed = isValidHttpUrl(rawUrl);
  if (!parsed) return badStatus(400, "invalid_url");

  if (isBlacklistedHost(parsed.hostname)) {
    return badStatus(400, "domain_blacklisted");
  }

  const normalizedUrl = parsed.toString();

  // Check auth status
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Handle custom path
  if (customPath) {
    if (!user) {
      return badStatus(401, "auth_required");
    }

    if (customPath.length < CUSTOM_PATH_MIN || customPath.length > CUSTOM_PATH_MAX) {
      return badStatus(400, "invalid_path_length");
    }

    if (!CUSTOM_PATH_RE.test(customPath)) {
      return badStatus(400, "invalid_path_chars");
    }

    if (isReservedCode(customPath)) {
      return badStatus(400, "path_reserved");
    }

    const exists = await findExistingCode(customPath);
    if (exists) {
      return badStatus(409, "path_taken");
    }

    const ok = await insertCode(customPath, normalizedUrl, user.id, null);
    if (ok) {
      return NextResponse.json({
        code: customPath,
        shortUrl: buildShortUrl(customPath),
        reused: false,
      });
    }

    return badStatus(500, "code_generation_failed");
  }

  // Dedupe: if this long URL already has a code, return it.
  const existing = await findExistingCodeByUrl(normalizedUrl);
  if (existing) {
    return NextResponse.json({
      code: existing,
      shortUrl: buildShortUrl(existing),
      reused: true,
    });
  }

  // Generate + insert with retry on collision.
  const expiresAt = user ? null : getExpiryDate();
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateCode();
    const ok = await insertCode(code, normalizedUrl, user?.id ?? null, expiresAt);
    if (ok) {
      return NextResponse.json({
        code,
        shortUrl: buildShortUrl(code),
        reused: false,
      });
    }
  }

  // Final attempt: dedupe once more in case a concurrent insert created the row.
  const raced = await findExistingCodeByUrl(normalizedUrl);
  if (raced) {
    return NextResponse.json({
      code: raced,
      shortUrl: buildShortUrl(raced),
      reused: true,
    });
  }

  return badStatus(500, "code_generation_failed");
}

function buildShortUrl(code: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    return `/${code}`;
  }
  return `${base}/${code}`;
}
