import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

// Body: { requirements: [{ min_power, max_power, min_deaths, min_kills }, ...] }
// Replaces the whole table — simplest correct behavior for an admin-managed list.
export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const { requirements } = await req.json();
  if (!Array.isArray(requirements)) {
    return Response.json({ ok: false, error: "requirements must be an array" }, { status: 400 });
  }
  const admin = supabaseAdmin();
  const { error: delErr } = await admin.from("power_requirements").delete().neq("id", 0);
  if (delErr) return Response.json({ ok: false, error: delErr.message }, { status: 500 });
  const { error: insErr } = await admin.from("power_requirements").insert(requirements);
  if (insErr) return Response.json({ ok: false, error: insErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
