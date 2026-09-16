// This route deliberately never touches the database -- it only
// relays the submission straight to Discord and discards everything
// afterward. Nothing here is stored anywhere.
export async function POST(req) {
  const formData = await req.formData();
  const governor_name = String(formData.get("governor_name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const screenshot = formData.get("screenshot");

  if (!governor_name || !screenshot) {
    return Response.json({ ok: false, error: "Governor name and a screenshot are required" }, { status: 400 });
  }

  if (!process.env.TELEPORT_WEBHOOK_URL) {
    return Response.json({ ok: false, error: "Teleport channel isn't configured yet -- ask an admin to set TELEPORT_WEBHOOK_URL" }, { status: 500 });
  }

  try {
    const content =
      `**Pass 7 Teleport — Crystal Spend**\n` +
      `Governor: ${governor_name}\n` +
      `Role: ${role || "Not specified"}`;

    const discordForm = new FormData();
    discordForm.append("payload_json", JSON.stringify({ content }));
    discordForm.append("files[0]", screenshot, screenshot.name || "crystal-spend.png");

    const res = await fetch(process.env.TELEPORT_WEBHOOK_URL, { method: "POST", body: discordForm });
    if (!res.ok) {
      return Response.json({ ok: false, error: "Discord rejected the message" }, { status: 502 });
    }
  } catch (e) {
    return Response.json({ ok: false, error: "Failed to reach Discord" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
