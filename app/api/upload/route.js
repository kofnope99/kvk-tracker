import * as XLSX from "xlsx";
import { supabaseAdmin } from "../../../lib/supabaseClient";
import { isAdmin } from "../../../lib/checkAdmin";

// Matches your spreadsheet's column headers to the fields we store,
// even if capitalization/wording is slightly different.
function pick(row, candidates) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const found = keys.find((k) => k.trim().toLowerCase() === c.toLowerCase());
    if (found) return row[found];
  }
  return undefined;
}

export async function POST(req) {
  if (!isAdmin()) {
    return Response.json({ ok: false, error: "Not logged in" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const kvk_event_id = formData.get("kvk_event_id");
  const label = formData.get("label") || "Snapshot";
  const is_baseline = formData.get("is_baseline") === "true";

  if (!file || !kvk_event_id) {
    return Response.json({ ok: false, error: "Missing file or KvK event" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

  if (rows.length === 0) {
    return Response.json({ ok: false, error: "Excel file looks empty" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: snapshot, error: snapErr } = await admin
    .from("snapshots")
    .insert({ kvk_event_id, label, is_baseline })
    .select()
    .single();
  if (snapErr) return Response.json({ ok: false, error: snapErr.message }, { status: 500 });

  const records = rows.map((row) => ({
    snapshot_id: snapshot.id,
    governor_id: String(pick(row, ["Governor ID", "GovernorID", "ID"]) ?? "").trim(),
    governor_name: String(pick(row, ["Governor Name", "Name"]) ?? "").trim(),
    power: Number(pick(row, ["Power"]) ?? 0),
    t4_kills: Number(pick(row, ["T4 Kills", "T4Kills", "Tier 4 Kills"]) ?? 0),
    t5_kills: Number(pick(row, ["T5 Kills", "T5Kills", "Tier 5 Kills"]) ?? 0),
    deaths: Number(pick(row, ["Deaths", "Dead", "Deads"]) ?? 0),
    acclaims: Number(pick(row, ["Acclaims", "Acclaim"]) ?? 0),
    healed_troops: Number(pick(row, ["Healed troops", "Healed Troops", "Healed"]) ?? 0),
    trades: Number(pick(row, ["Trades", "Trade"]) ?? 0),
  })).filter((r) => r.governor_id);

  const { error: insertErr } = await admin.from("governor_stats").insert(records);
  if (insertErr) return Response.json({ ok: false, error: insertErr.message }, { status: 500 });

  return Response.json({ ok: true, rows_saved: records.length });
}
