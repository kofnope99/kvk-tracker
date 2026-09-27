import { supabaseAdmin } from "../../../lib/supabaseClient";

export async function POST(req) {
  const { main_governor_id, farm_governor_id } = await req.json();
  if (!main_governor_id || !farm_governor_id) {
    return Response.json({ ok: false, error: "Both Governor IDs are required" }, { status: 400 });
  }
  const admin = supabaseAdmin();
  const { error } = await admin.from("account_links").insert({
    main_governor_id: String(main_governor_id).trim(),
    farm_governor_id: String(farm_governor_id).trim(),
    status: "pending",
  });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
