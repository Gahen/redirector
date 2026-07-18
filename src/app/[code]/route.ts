import { NextRequest, NextResponse } from "next/server";
import { getAnonClient, UrlRow } from "@/lib/supabase-clients";

export const runtime = "nodejs";

// Valid code charset: 1..5 url-safe base64 chars.
const CODE_RE = /^[A-Za-z0-9_-]{1,5}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } },
): Promise<NextResponse> {
  const code = decodeURIComponent(params.code ?? "");

  if (!CODE_RE.test(code)) {
    return notFoundResponse();
  }

  const client = getAnonClient();
  const { data, error } = await client
    .from("urls")
    .select("url")
    .eq("code", code)
    .limit(1)
    .maybeSingle();

  if (error) {
    return notFoundResponse();
  }

  const target = (data as Pick<UrlRow, "url"> | null)?.url;
  if (!target) {
    return notFoundResponse();
  }

  // Validate the stored target still parses with an http(s) scheme.
  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return notFoundResponse();
  }
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return notFoundResponse();
  }

  // Permanent redirect. `Location` must be absolute; new URL() guarantees it.
  return NextResponse.redirect(targetUrl.toString(), { status: 301 });
}

function notFoundResponse(): NextResponse {
  return new NextResponse("URL not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
