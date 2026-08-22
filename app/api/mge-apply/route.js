import { supabaseAdmin } from "../../../lib/supabaseClient";
import { getRecentKillHistory } from "../../../lib/kvkHistory";

export async function POST(req) {
  const { governor_id, governor_name } = await req.json();
  if (!governor_id || !governor_name) {
    return Response.json({ ok: false, error: "Missing Governor ID or name" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const id = String(governor_id).trim();
  const name = String(governor_name).trim();

  const { error: insertErr } = await admin.from("mge_applications").insert({ governor_id: id, governor_name: name });
  if (insertErr) {
    return Response.json({ ok: false, error: insertErr.message }, { status: 500 });
  }

  // Pull T4/T5 kills for the last 3 KvKs so admins can judge the
  // applicant's track record, not just their current KvK.
  let historyLines = "Kill history: not available";
  try {
    const history = await getRecentKillHistory(admin, id, 3);
    if (history.length > 0) {
      historyLines = history
        .map((h) => `${h.eventName}: T4 ${h.t4_kills.toLocaleString()} | T5 ${h.t5_kills.toLocaleString()}${h.found ? "" : " (not found)"}`)
        .join("\n");
    }
  } catch (e) {
    // if the history lookup fails, still send the notification without it
  }

  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `**New MGE Application**\nGovernor: ${name} (${id})\n${historyLines}`,
        }),
      });
    } catch (e) {
      // ignore -- application is already saved regardless
    }
  }

  return Response.json({ ok: true });
}
