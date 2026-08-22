import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false }, { status: 401 });
  const { kvk_event_id, t4_kills, t5_kills, deaths } = await req.json();
  const admin = supabaseAdmin();
  const rows = [
    { kvk_event_id, stat_name: "t4_kills", points_per_unit: t4_kills },
    { kvk_event_id, stat_name: "t5_kills", points_per_unit: t5_kills },
    { kvk_event_id, stat_name: "deaths", points_per_unit: deaths },
  ];
  const { error } = await admin
    .from("point_rules")
    .upsert(rows, { onConflict: "kvk_event_id,stat_name" });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
