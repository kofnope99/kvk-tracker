"use client";

import { useState } from "react";
import NavBar from "../../components/NavBar";

const ROLES = ["Swarmer", "Field", "Counter Rally", "Garrison", "Rally"];
const REMINDER_ROLES = ["Garrison", "Rally"];

export default function TeleportPage() {
  const [governorName, setGovernorName] = useState("");
  const [role, setRole] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onRoleChange(value) {
    setRole(value);
    if (REMINDER_ROLES.includes(value)) {
      alert("Please also send your tech and equipment screenshots to Todo or DeathKing in-game.");
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!governorName || !screenshot) {
      setStatus("Governor name and a crystal spend screenshot are both required.");
      return;
    }
    setSubmitting(true);
    setStatus("");
    const fd = new FormData();
    fd.append("governor_name", governorName);
    fd.append("role", role);
    fd.append("screenshot", screenshot);
    const res = await fetch("/api/teleport/submit", { method: "POST", body: fd });
    const json = await res.json();
    setSubmitting(false);
    if (json.ok) {
      setStatus("Sent to the Pass 7 channel!");
      setGovernorName("");
      setRole("");
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
          <h1 className="font-display text-4xl tracking-[0.1em] text-brassBright">PASS 7 TELEPORT</h1>
          <p className="text-steel text-sm">This just relays your submission to Discord — nothing is stored here.</p>
        </header>

        <form onSubmit={submit} className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <input
            required
            placeholder="Governor Name"
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={governorName}
            onChange={(e) => setGovernorName(e.target.value)}
          />
          <div>
            <label className="text-sm text-steel block mb-1">Crystal spend screenshot (required)</label>
            <input
              required
              type="file"
              accept="image/*"
              className="w-full text-sm text-steel"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
          </div>
          <select
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
          >
            <option value="">Role (optional)</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {REMINDER_ROLES.includes(role) && (
            <p className="text-sm text-flareBright border border-flare/50 rounded p-3">
              Reminder: send your tech and equipment screenshots to <strong>Todo</strong> or <strong>DeathKing</strong>{" "}
              in-game.
            </p>
          )}

          <button
            disabled={submitting}
            className="w-full bg-brass hover:bg-brassBright text-ink font-display tracking-wide px-6 py-3 rounded disabled:opacity-50"
          >
            {submitting ? "SENDING…" : "SUBMIT"}
          </button>
          {status && <p className="text-sm text-steel text-center">{status}</p>}
        </form>
      </div>
    </main>
  );
}
