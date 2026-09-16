"use client";
import { useState } from "react";

const ROLES = ["Swarmer", "Field", "Counter Rally", "Garrison", "Rally"];
const POPUP_ROLES = new Set(["Garrison", "Rally"]);

export default function TeleportPage() {
  const [governorName, setGovernorName] = useState("");
  const [role, setRole] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleRoleChange(value) {
    setRole(value);
    if (POPUP_ROLES.has(value)) {
      alert("Please also send your tech and equipment screenshots directly to Todo or DeathKing in-game.");
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!screenshot) {
      setStatus("Error: a crystal spend screenshot is required.");
      return;
    }
    setStatus("Submitting...");
    const fd = new FormData();
    fd.append("governor_name", governorName.trim());
    fd.append("role", role);
    fd.append("screenshot", screenshot);

    const res = await fetch("/api/teleport-apply", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) {
      setSubmitted(true);
      setStatus("");
    } else {
      setStatus(`Error: ${data.error}`);
    }
  }

  return (
    <main className="space-y-8">
      <header className="border-b-2 border-brass pb-4 mb-2">
        <p className="font-data text-xs tracking-[0.25em] text-brass uppercase">Kingdom 2194</p>
        <div className="flex items-end justify-between mt-1">
          <h1 className="font-display text-3xl uppercase tracking-wide text-paper">Pass 7 Teleport</h1>
          <a href="/" className="font-data text-xs tracking-wider text-steel hover:text-brassBright uppercase">← Home</a>
        </div>
      </header>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        {submitted ? (
          <div className="space-y-2">
            <p className="stamp font-data text-xs text-drabBright inline-block">SENT</p>
            <p className="text-sm text-steel">
              Your submission has been sent to the admin Discord channel.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-steel">
              Submit your crystal spend for a Pass 7 teleport. Nothing here is stored — it's sent directly to the admin Discord channel and discarded.
            </p>

            <div>
              <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">Governor Name</label>
              <input
                className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 mt-1 outline-none focus:border-brass"
                value={governorName}
                onChange={(e) => setGovernorName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">Crystal Spend Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                required
                className="w-full text-sm mt-1"
              />
              <p className="text-xs text-steelDim mt-1">Sent directly to Discord — not stored anywhere.</p>
            </div>

            <div>
              <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">Role (optional)</label>
              <select
                className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 mt-1 outline-none focus:border-brass"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="">Not specified</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {POPUP_ROLES.has(role) && (
                <p className="text-sm text-flareBright mt-2 border border-flare rounded-sm px-3 py-2 bg-panel2">
                  Please also send your tech and equipment screenshots directly to Todo or DeathKing in-game.
                </p>
              )}
            </div>

            <button className="bg-brass hover:bg-brassBright text-ink px-4 py-2 rounded-sm font-display uppercase tracking-wide">
              Submit
            </button>
            {status && <p className="text-sm text-steel">{status}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
