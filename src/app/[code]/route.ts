import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, UrlRow } from "@/lib/supabase-clients";

export const runtime = "nodejs";

const CODE_RE = /^[A-Za-z0-9_-]{1,15}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } },
): Promise<NextResponse> {
  const decodedCode = decodeURIComponent(params.code ?? "");

  if (!CODE_RE.test(decodedCode)) {
    return notFoundResponse();
  }

  const client = getServiceClient();
  const { data, error } = await client
    .from("urls")
    .select("url, expires_at")
    .eq("code", decodedCode)
    .limit(1)
    .maybeSingle();

  if (error) {
    return notFoundResponse();
  }

  const row = data as Pick<UrlRow, "url" | "expires_at"> | null;
  if (!row) {
    return notFoundResponse();
  }

  // Check if anonymous entry has expired
  if (row.expires_at) {
    const expiry = new Date(row.expires_at);
    if (expiry.getTime() < Date.now()) {
      return expiredResponse();
    }
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(row.url);
  } catch {
    return notFoundResponse();
  }
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return notFoundResponse();
  }

  return NextResponse.redirect(targetUrl.toString(), { status: 301 });
}

function notFoundResponse(): NextResponse {
  return new NextResponse("URL not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function expiredResponse(): NextResponse {
  return new NextResponse("This link has expired.", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
