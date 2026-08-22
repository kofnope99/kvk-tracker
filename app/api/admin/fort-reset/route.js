import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

// Wipes the entire fort tracker -- every week and every governor's
// fort stats -- for starting a new off-season from zero.
export async function POST() {
  if (!isAdmin()) return Response.json({ ok: false }, { status: 401 });
  const admin = supabaseAdmin();
  const { error } = await admin.from("fort_weeks").delete().neq("id", 0);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
