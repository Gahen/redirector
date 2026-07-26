import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();
  const { email, password } = body as { email: string; password: string };

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
