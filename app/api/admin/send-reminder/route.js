import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";
import { formatCompact } from "../../../../lib/points";
import { aggregateGovernors } from "../../../../lib/aggregate";

const POWER_THRESHOLD = 55_000_000;

function chunkMessage(lines, header) {
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
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });

  const webhook = process.env.ANNOUNCEMENT_WEBHOOK_URL;
  if (!webhook) return Response.json({ ok: false, error: "ANNOUNCEMENT_WEBHOOK_URL is not set" }, { status: 500 });

  const admin = supabaseAdmin();

  const { data: events } = await admin.from("kvk_events").select("*").eq("is_active", true).limit(1).single();
  if (!events) return Response.json({ ok: false, error: "No active KvK event set" }, { status: 400 });

  const { data: snapshots } = await admin
    .from("snapshots")
    .select("*")
    .eq("kvk_event_id", events.id)
    .order("created_at", { ascending: true });
  if (!snapshots?.length) return Response.json({ ok: false, error: "No snapshots uploaded for the active KvK" }, { status: 400 });

  const baseline = snapshots.find((s) => s.is_baseline);
  const latest = snapshots[snapshots.length - 1];

  const [latestRows, baselineRows, links, rulesRes, requirements] = await Promise.all([
    admin.from("governor_stats").select("*").eq("snapshot_id", latest.id).then((r) => r.data || []),
    baseline && baseline.id !== latest.id
      ? admin.from("governor_stats").select("*").eq("snapshot_id", baseline.id).then((r) => r.data || [])
      : Promise.resolve([]),
    admin.from("account_links").select("*").eq("status", "approved").then((r) => r.data || []),
    admin.from("point_rules").select("*").limit(1).single(),
    admin.from("power_requirements").select("*").order("min_power", { ascending: true }).then((r) => r.data || []),
  ]);

  const rules = rulesRes?.data || { t4_weight: 10, t5_weight: 12, death_weight: 60 };
  const rows = aggregateGovernors(baselineRows, latestRows, links, rules, requirements);

  const behind = rows
    .filter((r) => r.power > POWER_THRESHOLD && !r.pass)
    .sort((a, b) => b.power - a.power);

  if (behind.length === 0) {
    return Response.json({ ok: true, sent: 0, message: "Everyone above the power threshold has met their minimum." });
  }

  const lines = behind.map(
    (g) => `${g.name} (${g.id}) — ${formatCompact(g.points)} / ${formatCompact(g.required)} points`
  );
  const header = `@everyone **Kingsland Reminder — ${events.name}**\nThe following governors are above ${formatCompact(
    POWER_THRESHOLD
  )} power and have not met the current KvK minimum. Please fix this before the end of Kingsland:`;

  const chunks = chunkMessage(lines, header);
  for (const content of chunks) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      return Response.json({ ok: false, error: `Discord webhook failed: ${res.status}` }, { status: 500 });
    }
  }

  return Response.json({ ok: true, sent: behind.length, messages: chunks.length });
}
