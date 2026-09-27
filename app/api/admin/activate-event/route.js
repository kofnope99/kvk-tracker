import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const { kvk_event_id } = await req.json();
  if (!kvk_event_id) return Response.json({ ok: false, error: "kvk_event_id required" }, { status: 400 });
  const admin = supabaseAdmin();
  const { error: clearErr } = await admin.from("kvk_events").update({ is_active: false }).neq("id", kvk_event_id);
  if (clearErr) return Response.json({ ok: false, error: clearErr.message }, { status: 500 });
  const { error: setErr } = await admin.from("kvk_events").update({ is_active: true }).eq("id", kvk_event_id);
  if (setErr) return Response.json({ ok: false, error: setErr.message }, { status: 500 });
  return Response.json({ ok: true });
}
