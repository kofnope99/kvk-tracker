import { supabaseAdmin } from "../../../lib/supabaseClient";

export async function POST(req) {
  const { governor_id, governor_name } = await req.json();
  if (!governor_id || !governor_name) {
    return Response.json({ ok: false, error: "Missing Governor ID or name" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { error: insertErr } = await admin
    .from("mge_applications")
    .insert({ governor_id: String(governor_id).trim(), governor_name: String(governor_name).trim() });
  if (insertErr) {
    return Response.json({ ok: false, error: insertErr.message }, { status: 500 });
  }

  // Look up this governor's current kills/deaths (active KvK's latest
  // snapshot) to include in the Discord message, so admins don't have
  // to look it up separately.
  let statsLine = "Stats: not found in current KvK data";
  try {
    const { data: events } = await admin.from("kvk_events").select("*").order("id", { ascending: false });
    const active = events?.find((e) => e.is_active) || events?.[0];
    if (active) {
      const { data: snaps } = await admin
        .from("snapshots").select("*").eq("kvk_event_id", active.id).order("uploaded_at", { ascending: true });
      const latest = snaps?.[snaps.length - 1];
      if (latest) {
        const { data: row } = await admin
          .from("governor_stats").select("*")
          .eq("snapshot_id", latest.id).eq("governor_id", String(governor_id).trim()).maybeSingle();
        if (row) {
          statsLine = `Power: ${Number(row.power).toLocaleString()} | T4 Kills: ${Number(row.t4_kills).toLocaleString()} | T5 Kills: ${Number(row.t5_kills).toLocaleString()} | Deaths: ${Number(row.deaths).toLocaleString()}`;
        }
      }
    }
  } catch (e) {
    // if the stats lookup fails, still send the notification without it
  }

  // Post to Discord, if configured. Never let this block the
  // application from being saved -- webhook issues shouldn't lose data.
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:
            `**New MGE Application**\n` +
            `Governor: ${governor_name} (${governor_id})\n` +
            statsLine,
        }),
      });
    } catch (e) {
      // ignore -- application is already saved regardless
    }
  }

  return Response.json({ ok: true });
}
