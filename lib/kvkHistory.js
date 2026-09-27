import { supabasePublic } from "./supabaseClient";

// All ids in this schema are bigint. Supabase can hand those back as JS
// numbers, but every <select> in the UI produces string values — so we
// normalize every id to a string the moment it leaves the database. That
// way nothing downstream has to worry about "3" !== 3 again.
function str(v) {
  return v === null || v === undefined ? v : String(v);
}

export async function getKvkEvents() {
  const { data, error } = await supabasePublic
    .from("kvk_events")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((e) => ({ ...e, id: str(e.id) }));
}

export async function getActiveKvkEvent() {
  const events = await getKvkEvents();
  return events.find((e) => e.is_active) || events[events.length - 1] || null;
}

export async function getSnapshots(kvkEventId) {
  if (!kvkEventId) return [];
  const { data, error } = await supabasePublic
    .from("snapshots")
    .select("*")
    .eq("kvk_event_id", kvkEventId)
    .order("uploaded_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((s) => ({ ...s, id: str(s.id), kvk_event_id: str(s.kvk_event_id) }));
}

export async function getGovernorStats(snapshotId) {
  if (!snapshotId) return [];
  const { data, error } = await supabasePublic
    .from("governor_stats")
    .select("*")
    .eq("snapshot_id", snapshotId);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r, snapshot_id: str(r.snapshot_id) }));
}

export async function getApprovedLinks() {
  const { data, error } = await supabasePublic
    .from("account_links")
    .select("*")
    .eq("status", "approved");
  if (error) throw error;
  return data || [];
}

export async function getPointRules() {
  const { data, error } = await supabasePublic.from("point_rules").select("*").limit(1).single();
  if (error) return { t4_weight: 10, t5_weight: 12, death_weight: 60 };
  return data;
}

export async function getRequirements() {
  const { data, error } = await supabasePublic
    .from("power_requirements")
    .select("*")
    .order("min_power", { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Given a KvK's snapshots and a "selected" snapshot id, returns
 * {baselineRows, latestRows} ready to hand to aggregateGovernors().
 * If the selected snapshot IS the baseline, or there is only one
 * snapshot in the KvK, baseline is treated as empty (so the single
 * snapshot's own values show as the totals instead of diffing against
 * itself).
 */
export async function loadSnapshotPair(snapshots, selectedSnapshotId) {
  const selected = snapshots.find((s) => s.id === String(selectedSnapshotId)) || snapshots[snapshots.length - 1];
  if (!selected) return { baselineRows: [], latestRows: [] };

  const baseline = snapshots.find((s) => s.is_baseline);
  const latestRows = await getGovernorStats(selected.id);

  if (!baseline || baseline.id === selected.id) {
    return { baselineRows: [], latestRows };
  }
  const baselineRows = await getGovernorStats(baseline.id);
  return { baselineRows, latestRows };
}
