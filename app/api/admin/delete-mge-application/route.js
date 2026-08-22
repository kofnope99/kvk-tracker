import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false }, { status: 401 });
  const { id } = await req.json();
  const admin = supabaseAdmin();
  const { error } = await admin.from("mge_applications").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
