"use client";
import { useState } from "react";

export default function MgePage() {
  const [governorId, setGovernorId] = useState("");
  const [governorName, setGovernorName] = useState("");
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setStatus("Submitting...");
    const res = await fetch("/api/mge-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ governor_id: governorId.trim(), governor_name: governorName.trim() }),
    });
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
        <p className="font-data text-xs tracking-[0.25em] text-brass uppercase">Field Ledger — Alliance Ops</p>
        <div className="flex items-end justify-between mt-1">
          <h1 className="font-display text-3xl uppercase tracking-wide text-paper">MGE Application</h1>
          <a href="/" className="font-data text-xs tracking-wider text-steel hover:text-brassBright uppercase">← Home</a>
        </div>
      </header>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        {submitted ? (
          <div className="space-y-2">
            <p className="stamp font-data text-xs text-drabBright inline-block">SUBMITTED</p>
            <p className="text-sm text-steel">
              Your application has been sent to the alliance admins for review.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-steel">
              Apply for the Mightiest Governor Event. Enter your Governor ID and name exactly as they appear in-game — admins will review your current stats along with your application.
            </p>
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
