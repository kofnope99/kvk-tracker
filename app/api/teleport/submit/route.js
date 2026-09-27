// Pure relay — nothing here is ever written to the database.
export async function POST(req) {
  const webhook = process.env.TELEPORT_WEBHOOK_URL;
  if (!webhook) return Response.json({ ok: false, error: "TELEPORT_WEBHOOK_URL is not set" }, { status: 500 });

  const formData = await req.formData();
  const governor_name = String(formData.get("governor_name") || "").trim();
  const role = String(formData.get("role") || "");
  const screenshot = formData.get("screenshot");

  if (!governor_name || !screenshot || typeof screenshot !== "object" || screenshot.size === 0) {
    return Response.json({ ok: false, error: "Governor name and crystal spend screenshot are required" }, { status: 400 });
  }

  const content =
    `**Pass 7 Teleport Submission**\n` +
    `Governor: ${governor_name}\n` +
    `Role: ${role || "—"}`;

  const discordForm = new FormData();
  discordForm.append("payload_json", JSON.stringify({ content }));
  discordForm.append("files[0]", screenshot, screenshot.name || "crystal-spend.png");

  const res = await fetch(webhook, { method: "POST", body: discordForm });
  if (!res.ok) return Response.json({ ok: false, error: `Discord webhook failed: ${res.status}` }, { status: 500 });

  return Response.json({ ok: true });
}
