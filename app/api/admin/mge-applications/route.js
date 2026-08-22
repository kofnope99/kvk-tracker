import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";
import { getRecentKillHistory } from "../../../../lib/kvkHistory";

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false }, { status: 401 });
  const admin = supabaseAdmin();

  // Purge anything older than 14 days -- this data is deliberately
  // temporary. Runs every time the admin panel loads this section.
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("mge_applications").delete().lt("submitted_at", cutoff);

  const { data, error } = await admin
    .from("mge_applications").select("*").order("submitted_at", { ascending: false });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const applications = await Promise.all(
    (data || []).map(async (a) => ({
      ...a,
      killHistory: await getRecentKillHistory(admin, a.governor_id, 3),
    }))
  );

  return Response.json({ ok: true, applications });
}
