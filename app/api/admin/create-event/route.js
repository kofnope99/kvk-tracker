import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const { name } = await req.json();
  if (!name) return Response.json({ ok: false, error: "Name required" }, { status: 400 });
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("kvk_events").insert({ name, is_active: false }).select().single();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, event: data });
}
