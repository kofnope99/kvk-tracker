import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

// Makes exactly one KvK event "active" (the one governors see by
// default on the homepage) -- turns off is_active on every other event.
export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false }, { status: 401 });
  const { id } = await req.json();
  const admin = supabaseAdmin();

  const { error: offErr } = await admin.from("kvk_events").update({ is_active: false }).neq("id", 0);
  if (offErr) return Response.json({ ok: false, error: offErr.message }, { status: 500 });

  const { error: onErr } = await admin.from("kvk_events").update({ is_active: true }).eq("id", id);
  if (onErr) return Response.json({ ok: false, error: onErr.message }, { status: 500 });

  return Response.json({ ok: true });
}
