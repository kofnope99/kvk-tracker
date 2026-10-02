import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

export async function GET() {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("account_links").select("*").order("requested_at", { ascending: false });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, links: data });
}

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const { id, status } = await req.json();
  if (!id || !["approved", "rejected"].includes(status)) {
    return Response.json({ ok: false, error: "id and valid status required" }, { status: 400 });
  }
  const admin = supabaseAdmin();
  const { error } = await admin.from("account_links").update({ status }).eq("id", id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
