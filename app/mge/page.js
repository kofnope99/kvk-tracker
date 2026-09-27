"use client";

import { useState } from "react";
import NavBar from "../../components/NavBar";

const VIP_OPTIONS = [...Array.from({ length: 19 }, (_, i) => String(i + 1)), "SVIP"];
const MGE_TYPES = ["Cavalry", "Infantry", "Archer", "Engineering"];

export default function MgePage() {
  const [form, setForm] = useState({
    governor_id: "",
    governor_name: "",
    vip: "",
    mge_type: "",
    commander: "",
    message: "",
  });
  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (screenshot) fd.append("screenshot", screenshot);
    const res = await fetch("/api/mge/submit", { method: "POST", body: fd });
    const json = await res.json();
    setSubmitting(false);
    if (json.ok) {
      setStatus("Application sent!");
      setForm({ governor_id: "", governor_name: "", vip: "", mge_type: "", commander: "", message: "" });
      setScreenshot(null);
    } else {
      setStatus(json.error || "Something went wrong.");
    }
  }

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="font-display text-4xl tracking-[0.1em] text-brassBright">MGE APPLICATION</h1>
          <p className="text-steel text-sm">
            Applications are kept for 14 days only. Equipment screenshots are relayed to admins directly and are never
            stored.
          </p>
        </header>

        <form onSubmit={submit} className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <input
            required
            placeholder="Governor ID"
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={form.governor_id}
            onChange={(e) => setForm({ ...form, governor_id: e.target.value })}
          />
          <input
            required
            placeholder="Governor Name"
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={form.governor_name}
            onChange={(e) => setForm({ ...form, governor_name: e.target.value })}
          />
          <select
            required
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={form.vip}
            onChange={(e) => setForm({ ...form, vip: e.target.value })}
          >
            <option value="">VIP Level</option>
            {VIP_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v === "SVIP" ? "SVIP" : `VIP ${v}`}
              </option>
            ))}
          </select>
          <select
            required
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={form.mge_type}
            onChange={(e) => setForm({ ...form, mge_type: e.target.value })}
          >
            <option value="">MGE Type</option>
            {MGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Which commander do you want?"
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={form.commander}
            onChange={(e) => setForm({ ...form, commander: e.target.value })}
          />
          <div>
            <label className="text-sm text-steel block mb-1">Equipment screenshot (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-steel"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
          </div>
          <textarea
            placeholder="Anything else?"
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <button
            disabled={submitting}
            className="w-full bg-brass hover:bg-brassBright text-ink font-display tracking-wide px-6 py-3 rounded disabled:opacity-50"
          >
            {submitting ? "SENDING…" : "SUBMIT APPLICATION"}
          </button>
          {status && <p className="text-sm text-steel text-center">{status}</p>}
        </form>

        <p className="text-center text-brassBright font-body italic">
          Send more information to LeeLoo in-game
        </p>
      </div>
    </main>
  );
}
