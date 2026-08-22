import { computeDelta } from "./points";

// Given any Supabase client (public or admin), returns this governor's
// T4/T5 kill totals for each of the most recent `limit` KvK events.
export async function getRecentKillHistory(supabase, governorId, limit = 3) {
  const { data: events } = await supabase
    .from("kvk_events").select("*").order("id", { ascending: false }).limit(limit);

  const results = [];
  for (const ev of events || []) {
    const { data: snaps } = await supabase
      .from("snapshots").select("*").eq("kvk_event_id", ev.id).order("uploaded_at", { ascending: true });

    if (!snaps || snaps.length === 0) {
      results.push({ eventName: ev.name, t4_kills: 0, t5_kills: 0, found: false });
      continue;
    }

    const baseline = snaps.length > 1 ? (snaps.find((s) => s.is_baseline) || snaps[0]) : null;
    const latest = snaps[snaps.length - 1];

    const { data: latestRow } = await supabase
      .from("governor_stats").select("*").eq("snapshot_id", latest.id).eq("governor_id", governorId).maybeSingle();

    if (!latestRow) {
      results.push({ eventName: ev.name, t4_kills: 0, t5_kills: 0, found: false });
      continue;
    }

    let baselineRow = null;
    if (baseline) {
      const { data } = await supabase
        .from("governor_stats").select("*").eq("snapshot_id", baseline.id).eq("governor_id", governorId).maybeSingle();
      baselineRow = data;
    }

    const d = computeDelta(baselineRow, latestRow);
    results.push({ eventName: ev.name, t4_kills: d.t4_kills, t5_kills: d.t5_kills, found: true });
  }
  return results;
}
