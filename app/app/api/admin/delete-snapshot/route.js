import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false }, { status: 401 });
  const { id } = await req.json();
  const admin = supabaseAdmin();
  // governor_stats rows for this snapshot are removed automatically
  // (foreign key is set to cascade on delete).
  const { error } = await admin.from("snapshots").delete().eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
