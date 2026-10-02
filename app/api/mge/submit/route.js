import { supabaseAdmin } from "../../../../lib/supabaseClient";

export async function POST(req) {
  const formData = await req.formData();
  const governor_id = String(formData.get("governor_id") || "").trim();
  const governor_name = String(formData.get("governor_name") || "").trim();
  const vip = String(formData.get("vip") || "");
  const mge_type = String(formData.get("mge_type") || "");
  const commander = String(formData.get("commander") || "");
  const message = String(formData.get("message") || "");
  const screenshot = formData.get("screenshot");

  if (!governor_id || !governor_name || !vip || !mge_type) {
    return Response.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("mge_applications").insert({
    governor_id,
    governor_name,
    vip_level: vip,
    mge_type,
    commander,
    message,
  });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // Relay to Discord. The screenshot, if any, is sent straight through and
  // never written to the database or disk.
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (webhook) {
    const content =
      `**New MGE Application**\n` +
      `Governor: ${governor_name} (${governor_id})\n` +
      `VIP: ${vip}\n` +
      `Type: ${mge_type}\n` +
      `Commander requested: ${commander || "—"}\n` +
      `Message: ${message || "—"}`;

    if (screenshot && typeof screenshot === "object" && screenshot.size > 0) {
      const discordForm = new FormData();
      discordForm.append("payload_json", JSON.stringify({ content }));
      discordForm.append("files[0]", screenshot, screenshot.name || "equipment.png");
      await fetch(webhook, { method: "POST", body: discordForm });
    } else {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    }
  }

  return Response.json({ ok: true });
}
