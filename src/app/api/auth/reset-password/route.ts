import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();
  const { email } = body as { email: string };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
