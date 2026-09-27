import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

const RULE_KEY_TO_STAT_NAME = { t4_weight: "t4_kills", t5_weight: "t5_kills", death_weight: "deaths" };

// Body: { kvk_event_id, t4_weight, t5_weight, death_weight }
// point_rules is one row per stat per KvK event — replace that event's 3 rows.
export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const { kvk_event_id, t4_weight, t5_weight, death_weight } = await req.json();
  if (!kvk_event_id) return Response.json({ ok: false, error: "kvk_event_id is required" }, { status: 400 });

  const admin = supabaseAdmin();
  const { error: delErr } = await admin.from("point_rules").delete().eq("kvk_event_id", kvk_event_id);
  if (delErr) return Response.json({ ok: false, error: delErr.message }, { status: 500 });

  const values = { t4_weight, t5_weight, death_weight };
  const rows = Object.entries(values).map(([ruleKey, val]) => ({
    kvk_event_id,
    stat_name: RULE_KEY_TO_STAT_NAME[ruleKey],
    points_per_unit: val,
  }));
  const { error: insErr } = await admin.from("point_rules").insert(rows);
  if (insErr) return Response.json({ ok: false, error: insErr.message }, { status: 500 });

  return Response.json({ ok: true });
}
