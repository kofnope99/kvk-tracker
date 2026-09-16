import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";
import { computeDelta, computePoints, findRequirementTier, computeRequiredPoints } from "../../../../lib/points";

const POWER_THRESHOLD = 55_000_000;

// Splits a long message into Discord-safe chunks (2000 char limit),
// only pinging @everyone once, on the first chunk.
function chunkMessage(header, lines) {
  const chunks = [];
  let current = header;
  for (const line of lines) {
    if ((current + "\n" + line).length > 1900) {
      chunks.push(current);
      current = line;
    } else {
      current += "\n" + line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function POST() {
  if (!isAdmin()) return Response.json({ ok: false }, { status: 401 });
  const admin = supabaseAdmin();

  const { data: events } = await admin.from("kvk_events").select("*").order("id", { ascending: false });
  const active = events?.find((e) => e.is_active) || events?.[0];
  if (!active) return Response.json({ ok: false, error: "No KvK event found" }, { status: 400 });

  const { data: snaps } = await admin
    .from("snapshots").select("*").eq("kvk_event_id", active.id).order("uploaded_at", { ascending: true });
  if (!snaps || snaps.length === 0) return Response.json({ ok: false, error: "No stats uploaded for the current KvK" }, { status: 400 });

  const baseline = snaps.length > 1 ? (snaps.find((s) => s.is_baseline) || snaps[0]) : null;
  const latest = snaps[snaps.length - 1];
  const snapshotIds = baseline ? [baseline.id, latest.id] : [latest.id];

  const { data: rows } = await admin.from("governor_stats").select("*").in("snapshot_id", snapshotIds);
  const baselineRows = baseline ? (rows || []).filter((r) => r.snapshot_id === baseline.id) : [];
  const latestRows = (rows || []).filter((r) => r.snapshot_id === latest.id);

  const { data: links } = await admin.from("account_links").select("*").eq("status", "approved");
  const farmIds = new Set((links || []).map((l) => l.farm_governor_id));
  const farmsByMain = {};
  for (const l of links || []) (farmsByMain[l.main_governor_id] ||= []).push(l.farm_governor_id);

  const { data: rules } = await admin.from("point_rules").select("*").eq("kvk_event_id", active.id);
  const { data: requirements } = await admin
    .from("power_requirements").select("*").eq("kvk_event_id", active.id).order("min_power", { ascending: true });

  const flagged = [];
  for (const l of latestRows) {
    if (farmIds.has(l.governor_id)) continue;
    const b = baselineRows.find((r) => r.governor_id === l.governor_id);
    const d = computeDelta(b, l);
    let t4 = d.t4_kills, t5 = d.t5_kills, deaths = d.deaths;
    const power = d.power;
    for (const farmId of farmsByMain[l.governor_id] || []) {
      const fl = latestRows.find((r) => r.governor_id === farmId);
      if (!fl) continue;
      const fb = baselineRows.find((r) => r.governor_id === farmId);
      const fd = computeDelta(fb, fl);
      t4 += fd.t4_kills * 0.2;
      t5 += fd.t5_kills * 0.2;
      deaths += fd.deaths * 0.2;
    }
    const points = computePoints({ t4_kills: t4, t5_kills: t5, deaths }, rules);
    const tier = findRequirementTier(power, requirements);
    const required = computeRequiredPoints(tier, rules);

    if (power > POWER_THRESHOLD && points < required) {
      flagged.push({ id: l.governor_id, name: l.governor_name || l.governor_id, points, required });
    }
  }

  if (flagged.length === 0) {
    return Response.json({ ok: true, count: 0 });
  }

  console.log("DEBUG send-reminder: ANNOUNCEMENT_WEBHOOK_URL set?", Boolean(process.env.ANNOUNCEMENT_WEBHOOK_URL));
  console.log("DEBUG send-reminder: same as DISCORD_WEBHOOK_URL?", process.env.ANNOUNCEMENT_WEBHOOK_URL === process.env.DISCORD_WEBHOOK_URL);
  console.log("DEBUG send-reminder: ANNOUNCEMENT_WEBHOOK_URL length:", (process.env.ANNOUNCEMENT_WEBHOOK_URL || "").length);

  if (!process.env.ANNOUNCEMENT_WEBHOOK_URL) {
    return Response.json({ ok: false, error: "ANNOUNCEMENT_WEBHOOK_URL isn't configured" }, { status: 500 });
  }

  const header =
    `@everyone\n` +
    `**Kingsland Reminder — ${active.name}**\n` +
    `The following governors (55M+ power) have not yet met the current KvK's minimum requirement. Please meet it before the end of Kingsland.`;

  const lines = flagged.map(
    (g) => `${g.name} (${g.id}) — ${Math.round(g.points).toLocaleString()} / ${Math.round(g.required).toLocaleString()} points`
  );

  const chunks = chunkMessage(header, lines);

  try {
    for (const content of chunks) {
      await fetch(process.env.ANNOUNCEMENT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    }
  } catch (e) {
    return Response.json({ ok: false, error: "Failed to reach Discord" }, { status: 502 });
  }

  return Response.json({ ok: true, count: flagged.length });
}
