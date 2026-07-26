import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase-clients";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serviceClient = getServiceClient();
  const { error } = await serviceClient
    .from("urls")
    .delete()
    .eq("id", params.id)
    .eq("owner_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
