import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const { t4_weight, t5_weight, death_weight } = await req.json();
  const admin = supabaseAdmin();
  const { data: existing } = await admin.from("point_rules").select("id").limit(1).single();
  const payload = { t4_weight, t5_weight, death_weight };
  const query = existing
    ? admin.from("point_rules").update(payload).eq("id", existing.id)
    : admin.from("point_rules").insert(payload);
  const { error } = await query;
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
