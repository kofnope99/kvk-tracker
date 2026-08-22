"use client";
import { useState } from "react";

const VIP_LEVELS = Array.from({ length: 18 }, (_, i) => i + 1);
const MGE_TYPES = ["Cavalry", "Infantry", "Archer", "Engineering"];

export default function MgePage() {
  const [governorId, setGovernorId] = useState("");
  const [governorName, setGovernorName] = useState("");
  const [vipLevel, setVipLevel] = useState("1");
  const [mgeType, setMgeType] = useState(MGE_TYPES[0]);
  const [commander, setCommander] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setStatus("Submitting...");
    const fd = new FormData();
    fd.append("governor_id", governorId.trim());
    fd.append("governor_name", governorName.trim());
    fd.append("vip_level", vipLevel);
    fd.append("mge_type", mgeType);
    fd.append("commander", commander.trim());
    fd.append("message", message.trim());
    if (screenshot) fd.append("screenshot", screenshot);

    const res = await fetch("/api/mge-apply", { method: "POST", body: fd });
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
          <h1 className="font-display text-3xl uppercase tracking-wide text-paper">MGE Application</h1>
          <a href="/" className="font-data text-xs tracking-wider text-steel hover:text-brassBright uppercase">← Home</a>
        </div>
      </header>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        {submitted ? (
          <div className="space-y-3">
            <p className="stamp font-data text-xs text-drabBright inline-block">SUBMITTED</p>
            <p className="text-sm text-steel">
              Your application has been sent to the alliance admins for review.
            </p>
            <p className="text-sm text-brassBright font-display uppercase tracking-wide">
              Send more information to LeeLoo in-game.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-steel">
              Apply for the Mightiest Governor Event. Enter your details exactly as they appear in-game — admins will review your application along with your recent stats.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">Governor ID</label>
                <input
                  className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 mt-1 font-data focus:border-brass outline-none"
                  value={governorId}
                  onChange={(e) => setGovernorId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">Governor Name</label>
                <input
                  className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 mt-1 outline-none focus:border-brass"
                  value={governorName}
                  onChange={(e) => setGovernorName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">VIP Level</label>
                <select
                  className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 mt-1 outline-none focus:border-brass"
                  value={vipLevel}
                  onChange={(e) => setVipLevel(e.target.value)}
                >
                  {VIP_LEVELS.map((v) => <option key={v} value={v}>VIP {v}</option>)}
                </select>
              </div>
              <div>
                <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">MGE Type</label>
                <select
                  className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 mt-1 outline-none focus:border-brass"
                  value={mgeType}
                  onChange={(e) => setMgeType(e.target.value)}
                >
                  {MGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">Commander You Want</label>
              <input
                className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 mt-1 outline-none focus:border-brass"
                value={commander}
                onChange={(e) => setCommander(e.target.value)}
                placeholder="e.g. Alexander, Charles Martel"
              />
            </div>

            <div>
              <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">Equipment Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="w-full text-sm mt-1"
              />
              <p className="text-xs text-steelDim mt-1">Sent directly to the admin Discord channel — not stored anywhere.</p>
            </div>

            <div>
              <label className="font-data text-[10px] tracking-widest text-steelDim uppercase">Message (optional)</label>
              <textarea
                className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 mt-1 outline-none focus:border-brass"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <p className="text-sm text-brassBright font-display uppercase tracking-wide">
              Send more information to LeeLoo in-game.
            </p>

            <button className="bg-brass hover:bg-brassBright text-ink px-4 py-2 rounded-sm font-display uppercase tracking-wide">
              Submit Application
            </button>
            {status && <p className="text-sm text-steel">{status}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
