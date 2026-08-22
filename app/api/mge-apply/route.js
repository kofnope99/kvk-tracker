import { supabaseAdmin } from "../../../lib/supabaseClient";
import { getRecentKillHistory } from "../../../lib/kvkHistory";

export async function POST(req) {
  const formData = await req.formData();
  const governor_id = String(formData.get("governor_id") || "").trim();
  const governor_name = String(formData.get("governor_name") || "").trim();
  const vip_level = formData.get("vip_level") ? Number(formData.get("vip_level")) : null;
  const mge_type = String(formData.get("mge_type") || "").trim();
  const commander = String(formData.get("commander") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const screenshot = formData.get("screenshot"); // File | null -- never saved, only forwarded to Discord

  if (!governor_id || !governor_name) {
    return Response.json({ ok: false, error: "Missing Governor ID or name" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { error: insertErr } = await admin.from("mge_applications").insert({
    governor_id, governor_name, vip_level, mge_type, commander, message,
  });
  if (insertErr) {
    return Response.json({ ok: false, error: insertErr.message }, { status: 500 });
  }

  // Pull T4/T5 kills for the last 3 KvKs so admins can judge the
  // applicant's track record, not just their current KvK.
  let historyLines = "Kill history: not available";
  try {
    const history = await getRecentKillHistory(admin, governor_id, 3);
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
      const content =
        `**New MGE Application**\n` +
        `Governor: ${governor_name} (${governor_id})\n` +
        `VIP: ${vip_level ?? "—"} | Type: ${mge_type || "—"} | Commander wanted: ${commander || "—"}\n` +
        (message ? `Message: ${message}\n` : "") +
        historyLines;

      if (screenshot && typeof screenshot.arrayBuffer === "function") {
        // Forward the image straight through to Discord -- it's never
        // written to disk or the database, only relayed in-memory.
        const discordForm = new FormData();
        discordForm.append("payload_json", JSON.stringify({ content }));
        discordForm.append("files[0]", screenshot, screenshot.name || "equipment.png");
        await fetch(process.env.DISCORD_WEBHOOK_URL, { method: "POST", body: discordForm });
      } else {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      }
    } catch (e) {
      // ignore -- application is already saved regardless
    }
  }

  return Response.json({ ok: true });
}
