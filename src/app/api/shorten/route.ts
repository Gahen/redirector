import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, getServiceClient, UrlRow } from "@/lib/supabase-clients";
import { isBlacklistedHost } from "@/lib/blacklist";
import { generateCode } from "@/lib/code";

export const runtime = "nodejs";

const MAX_CODE_ATTEMPTS = 5;

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
  const client = getAnonClient();
  const { data, error } = await client
    .from("urls")
    .select("code")
    .eq("url", url)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as Pick<UrlRow, "code"> | null)?.code ?? null;
}

async function insertCode(code: string, url: string): Promise<boolean> {
  const client = getServiceClient();
  const { error } = await client.from("urls").insert({ code, url });
  if (!error) return true;
  // Postgres unique violation = 23505. supabase-js surfaces it as error.code.
  if (error.code === "23505") return false;
  // Unexpected error — surface as failure.
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

  const parsed = isValidHttpUrl(rawUrl);
  if (!parsed) return badStatus(400, "invalid_url");

  // Blacklist check (port already stripped by URL.hostname).
  if (isBlacklistedHost(parsed.hostname)) {
    return badStatus(400, "domain_blacklisted");
  }

  const normalizedUrl = parsed.toString();

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
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateCode();
    const ok = await insertCode(code, normalizedUrl);
    if (ok) {
      return NextResponse.json({
        code,
        shortUrl: buildShortUrl(code),
        reused: false,
      });
    }
    // Collision, or insert returned the code race; loop and try a new code.
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
    // Fallback: avoid a malformed "//code" if env is missing.
    return `/${code}`;
  }
  return `${base}/${code}`;
}
