import { supabaseAdmin } from "../../../lib/supabaseClient";

// Anyone can call this (a governor linking their own farm) -- it only
// ever creates a "pending" row; an admin must approve it before it counts.
export async function POST(req) {
  const { main_governor_id, farm_governor_id } = await req.json();
  if (!main_governor_id || !farm_governor_id) {
    return Response.json({ ok: false, error: "Missing IDs" }, { status: 400 });
  }
  if (main_governor_id === farm_governor_id) {
    return Response.json({ ok: false, error: "Main and farm ID can't be the same" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("account_links")
    .insert({ main_governor_id, farm_governor_id, status: "pending" });

  if (error) {
    const msg = error.code === "23505" ? "That farm ID is already linked or pending." : error.message;
    return Response.json({ ok: false, error: msg }, { status: 400 });
  }
  return Response.json({ ok: true });
}
