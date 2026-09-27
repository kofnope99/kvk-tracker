import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

// Body: { kvk_event_id, requirements: [{ min_power, max_power, min_deaths, min_kills }, ...] }
// Tiers are scoped per KvK event — replaces only that event's tiers.
export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const { kvk_event_id, requirements } = await req.json();
  if (!kvk_event_id) return Response.json({ ok: false, error: "kvk_event_id is required" }, { status: 400 });
  if (!Array.isArray(requirements)) {
    return Response.json({ ok: false, error: "requirements must be an array" }, { status: 400 });
  }
  const admin = supabaseAdmin();
  const { error: delErr } = await admin.from("power_requirements").delete().eq("kvk_event_id", kvk_event_id);
  if (delErr) return Response.json({ ok: false, error: delErr.message }, { status: 500 });

  if (requirements.length) {
    const rows = requirements.map((r) => ({
      kvk_event_id,
      min_power: r.min_power,
      max_power: r.max_power,
      min_deaths: r.min_deaths,
      min_kills: r.min_kills,
    }));
    const { error: insErr } = await admin.from("power_requirements").insert(rows);
    if (insErr) return Response.json({ ok: false, error: insErr.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
