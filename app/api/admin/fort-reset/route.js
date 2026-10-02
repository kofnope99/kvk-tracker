import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function POST() {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const admin = supabaseAdmin();
  const { data: weeks } = await admin.from("fort_weeks").select("id");
  const ids = (weeks || []).map((w) => w.id);
  if (ids.length) {
    await admin.from("fort_stats").delete().in("week_id", ids);
    await admin.from("fort_weeks").delete().in("id", ids);
  }
  return Response.json({ ok: true });
}
