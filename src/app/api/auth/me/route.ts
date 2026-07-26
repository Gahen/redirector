import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, email: user.email });
}
