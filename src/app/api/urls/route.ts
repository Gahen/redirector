import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase-clients";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("urls")
    .select("id, code, url, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ urls: data });
}
