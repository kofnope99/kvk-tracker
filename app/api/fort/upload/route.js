import * as XLSX from "xlsx";
import { supabaseAdmin } from "../../../../lib/supabaseClient";
import { isAdmin } from "../../../../lib/checkAdmin";

function pick(row, candidates) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const found = keys.find((k) => k.trim().toLowerCase() === c.toLowerCase());
    if (found) return row[found];
  }
  return undefined;
}

export async function POST(req) {
  if (!isAdmin()) return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file");
  const label = formData.get("label") || "Week";
  if (!file) return Response.json({ ok: false, error: "Missing file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });
  if (rows.length === 0) return Response.json({ ok: false, error: "Excel file looks empty" }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: week, error: weekErr } = await admin.from("fort_weeks").insert({ label }).select().single();
  if (weekErr) return Response.json({ ok: false, error: weekErr.message }, { status: 500 });

  const records = rows
    .map((row) => ({
      fort_week_id: week.id,
      governor_id: String(pick(row, ["governor_id", "Governor ID", "ID"]) ?? "").trim(),
      governor_name: String(pick(row, ["name", "Governor Name", "Name"]) ?? "").trim(),
      started: Number(pick(row, ["started", "Started"]) ?? 0),
      completed: Number(pick(row, ["completed", "Completed"]) ?? 0),
      joined: Number(pick(row, ["joined", "Joined"]) ?? 0),
      total: Number(pick(row, ["Total", "total"]) ?? 0),
    }))
    .filter((r) => r.governor_id);

  const { error: insErr } = await admin.from("fort_stats").insert(records);
  if (insErr) return Response.json({ ok: false, error: insErr.message }, { status: 500 });

  return Response.json({ ok: true, rows_saved: records.length, week });
}
