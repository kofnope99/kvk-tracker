import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false }, { status: 401 });
  const { kvk_event_id, min_power, max_power, min_deaths, min_kills } = await req.json();
  const admin = supabaseAdmin();
  const { error } = await admin.from("power_requirements").insert({
    kvk_event_id,
    min_power,
    max_power: max_power || null,
    min_deaths,
    min_kills,
  });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
