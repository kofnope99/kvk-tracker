import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";
import { computeDelta } from "../../../../lib/points";

const RETENTION_DAYS = 14;

export async function GET() {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const admin = supabaseAdmin();

  // Purge anything older than the retention window before returning results.
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("mge_applications").delete().lt("submitted_at", cutoff);

  const { data: applications, error } = await admin
    .from("mge_applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // Last 3 KvK events' T4/T5 kill totals per applicant, for admin context.
  const { data: events } = await admin
    .from("kvk_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  const history = {};
  for (const app of applications || []) {
    history[app.governor_id] = [];
  }

  for (const ev of events || []) {
    const { data: snaps } = await admin
      .from("snapshots")
      .select("*")
      .eq("kvk_event_id", ev.id)
      .order("uploaded_at", { ascending: true });
    if (!snaps?.length) continue;
    const baseline = snaps.find((s) => s.is_baseline);
    const latest = snaps[snaps.length - 1];

    const { data: latestRows } = await admin.from("governor_stats").select("*").eq("snapshot_id", latest.id);
    const baselineRows =
      baseline && baseline.id !== latest.id
        ? (await admin.from("governor_stats").select("*").eq("snapshot_id", baseline.id)).data || []
        : [];

    const baselineById = new Map(baselineRows.map((r) => [r.governor_id, r]));
    const latestById = new Map(latestRows?.map((r) => [r.governor_id, r]) || []);

    for (const app of applications || []) {
      const l = latestById.get(app.governor_id);
      if (!l) continue;
      const b = baselineById.get(app.governor_id) || null;
      const d = computeDelta(b, l);
      history[app.governor_id].push({ kvk: ev.name, t4_kills: d.t4_kills, t5_kills: d.t5_kills });
    }
  }

  return Response.json({ ok: true, applications, history });
}
