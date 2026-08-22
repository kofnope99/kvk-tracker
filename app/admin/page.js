"use client";
import { useEffect, useState } from "react";
import { supabasePublic } from "../../lib/supabaseClient";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [newEventName, setNewEventName] = useState("");

  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [isBaseline, setIsBaseline] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const [t4, setT4] = useState(10);
  const [t5, setT5] = useState(12);
  const [deathPts, setDeathPts] = useState(60);
  const [rulesMsg, setRulesMsg] = useState("");

  const [minPower, setMinPower] = useState("");
  const [maxPower, setMaxPower] = useState("");
  const [minDeaths, setMinDeaths] = useState("");
  const [minKills, setMinKills] = useState("");
  const [reqMsg, setReqMsg] = useState("");
  const [requirements, setRequirements] = useState([]);

  const [pendingLinks, setPendingLinks] = useState([]);
  const [eventSnapshots, setEventSnapshots] = useState([]);
  const [mgeApplications, setMgeApplications] = useState([]);
  const [mgeLoading, setMgeLoading] = useState(false);

  const [fortWeeks, setFortWeeks] = useState([]);
  const [fortFile, setFortFile] = useState(null);
  const [fortLabel, setFortLabel] = useState("");
  const [fortMsg, setFortMsg] = useState("");

  async function refreshEventSnapshots(eventId) {
    if (!eventId) return;
    const { data } = await supabasePublic
      .from("snapshots")
      .select("*")
      .eq("kvk_event_id", eventId)
      .order("uploaded_at", { ascending: true });
    setEventSnapshots(data || []);
  }

  async function deleteSnapshot(id) {
    if (!confirm("Delete this snapshot and all its governor stats? This can't be undone.")) return;
    await fetch("/api/admin/delete-snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refreshEventSnapshots(selectedEvent);
  }

  async function refreshEvents() {
    const { data } = await supabasePublic.from("kvk_events").select("*").order("id", { ascending: false });
    setEvents(data || []);
    if (data && data.length && !selectedEvent) setSelectedEvent(data[0].id);
  }
  async function refreshRequirements(eventId) {
    if (!eventId) return;
    const { data } = await supabasePublic.from("power_requirements").select("*").eq("kvk_event_id", eventId).order("min_power");
    setRequirements(data || []);
  }
  async function refreshPendingLinks() {
    const { data } = await supabasePublic.from("account_links").select("*").eq("status", "pending");
    setPendingLinks(data || []);
  }

  async function refreshMgeApplications() {
    setMgeLoading(true);
    const res = await fetch("/api/admin/mge-applications", { method: "POST" });
    const data = await res.json();
    setMgeApplications(data.ok ? data.applications : []);
    setMgeLoading(false);
  }

  async function deleteMgeApplication(id) {
    await fetch("/api/admin/delete-mge-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refreshMgeApplications();
  }

  async function refreshFortWeeks() {
    const { data } = await supabasePublic.from("fort_weeks").select("*").order("uploaded_at", { ascending: true });
    setFortWeeks(data || []);
  }

  async function uploadFort(e) {
    e.preventDefault();
    setFortMsg("Uploading...");
    const fd = new FormData();
    fd.append("file", fortFile);
    fd.append("label", fortLabel || `Week ${fortWeeks.length + 1}`);
    const res = await fetch("/api/admin/fort-upload", { method: "POST", body: fd });
    const data = await res.json();
    setFortMsg(data.ok ? `Saved ${data.rows_saved} rows.` : `Error: ${data.error}`);
    if (data.ok) { setFortLabel(""); refreshFortWeeks(); }
  }

  async function deleteFortWeek(id) {
    await fetch("/api/admin/delete-fort-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refreshFortWeeks();
  }

  async function resetFortTracker() {
    if (!confirm("Reset the fort tracker? This deletes every uploaded week and can't be undone. Only do this at the start of a new off-season.")) return;
    await fetch("/api/admin/fort-reset", { method: "POST" });
    refreshFortWeeks();
  }

  useEffect(() => {
    if (loggedIn) {
      refreshEvents();
      refreshPendingLinks();
      refreshMgeApplications();
      refreshFortWeeks();
    }
  }, [loggedIn]);
  useEffect(() => {
    if (selectedEvent) {
      refreshRequirements(selectedEvent);
      refreshEventSnapshots(selectedEvent);
    }
  }, [selectedEvent]);

  async function login(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.ok) setLoggedIn(true);
    else setLoginError("Wrong password");
  }

  async function createEvent(e) {
    e.preventDefault();
    await fetch("/api/admin/kvk-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newEventName }),
    });
    setNewEventName("");
    refreshEvents();
  }

  async function upload(e) {
    e.preventDefault();
    setUploadMsg("Uploading...");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kvk_event_id", selectedEvent);
    fd.append("label", label || "Snapshot");
    fd.append("is_baseline", String(isBaseline));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadMsg(data.ok ? `Saved ${data.rows_saved} rows.` : `Error: ${data.error}`);
    if (data.ok) refreshEventSnapshots(selectedEvent);
  }

  async function saveRules(e) {
    e.preventDefault();
    const res = await fetch("/api/admin/point-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kvk_event_id: selectedEvent, t4_kills: t4, t5_kills: t5, deaths: deathPts }),
    });
    const data = await res.json();
    setRulesMsg(data.ok ? "Saved." : `Error: ${data.error}`);
  }

  async function addRequirement(e) {
    e.preventDefault();
    const res = await fetch("/api/admin/power-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kvk_event_id: selectedEvent,
        min_power: Number(minPower),
        max_power: maxPower ? Number(maxPower) : null,
        min_deaths: Number(minDeaths),
        min_kills: Number(minKills),
      }),
    });
    const data = await res.json();
    setReqMsg(data.ok ? "Added." : `Error: ${data.error}`);
    if (data.ok) { setMinPower(""); setMaxPower(""); setMinDeaths(""); setMinKills(""); refreshRequirements(selectedEvent); }
  }

  async function activateEvent() {
    await fetch("/api/admin/activate-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedEvent }),
    });
    refreshEvents();
  }

  async function decideLink(id, status) {
    await fetch("/api/admin/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    refreshPendingLinks();
  }

  if (!loggedIn) {
    return (
      <main className="max-w-sm mx-auto mt-20">
        <form onSubmit={login} className="bg-panel rounded-sm border border-hairline p-6 space-y-4">
          <h1 className="font-display text-lg uppercase tracking-wide text-paper">Admin Login</h1>
          <input type="password" className="w-full rounded-sm bg-panel2 px-3 py-2" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          {loginError && <p className="text-flareBright text-sm">{loginError}</p>}
          <button className="w-full bg-brass hover:bg-brassBright text-ink py-2 rounded-sm font-semibold">Log in</button>
        </form>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-paper">Admin Panel</h1>
        <a href="/" className="text-sm text-steel hover:text-paper">← Back to site</a>
      </header>

      <section className="bg-panel rounded-sm border border-hairline p-6 space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">KvK Events</h2>
        <form onSubmit={createEvent} className="flex gap-2">
          <input className="flex-1 rounded-sm bg-panel2 px-3 py-2" placeholder="e.g. KvK Season 5"
            value={newEventName} onChange={(e) => setNewEventName(e.target.value)} required />
          <button className="bg-panel2 hover:bg-panel3 px-4 py-2 rounded-sm">Create</button>
        </form>
        <select className="w-full rounded-sm bg-panel2 px-3 py-2" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}{ev.is_active ? " (active)" : ""}</option>)}
        </select>
        <div className="flex items-center justify-between">
          <p className="text-xs text-steelDim">
            "Active" is the one governors see by default on the homepage. Uploading, point values, and requirements all still work on any event you pick above, active or not.
          </p>
          <button onClick={activateEvent} className="shrink-0 ml-3 text-xs bg-drab hover:bg-drabBright text-ink font-semibold px-3 py-1.5 rounded whitespace-nowrap">
            Set as active
          </button>
        </div>
      </section>

      <section className="bg-panel rounded-sm border border-hairline p-6 space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">Upload stats (Excel)</h2>
        <p className="text-sm text-steel">
          Columns expected: Governor ID, Name, Power, T4 Kills, T5 Kills, Deaths. Also picked up if present: Acclaims, Healed troops, Trades (shown as info only, not counted in points). Mark the very first upload of a KvK as "baseline" — every later upload is compared against it.
        </p>
        <form onSubmit={upload} className="space-y-3">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files[0])} required className="text-sm" />
          <input className="w-full rounded-sm bg-panel2 px-3 py-2" placeholder="Label (e.g. Day 3)"
            value={label} onChange={(e) => setLabel(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isBaseline} onChange={(e) => setIsBaseline(e.target.checked)} />
            This is the baseline (first) snapshot for this KvK
          </label>
          <button className="bg-brass hover:bg-brassBright text-ink px-4 py-2 rounded-sm font-semibold">Upload</button>
        </form>
        {uploadMsg && <p className="text-sm text-steel">{uploadMsg}</p>}

        {eventSnapshots.length > 0 && (
          <div className="pt-2">
            <p className="text-sm text-steel mb-2">Uploaded snapshots for this KvK:</p>
            <ul className="space-y-2">
              {eventSnapshots.map((s) => (
                <li key={s.id} className="flex items-center justify-between bg-panel2 rounded-sm px-3 py-2">
                  <span className="text-sm">{s.label}{s.is_baseline ? " (baseline)" : ""}</span>
                  <button onClick={() => deleteSnapshot(s.id)} className="text-xs bg-flare hover:bg-flareBright text-ink font-semibold px-3 py-1 rounded">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="bg-panel rounded-sm border border-hairline p-6 space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">Point values</h2>
        <form onSubmit={saveRules} className="grid grid-cols-3 gap-3">
          <label className="text-sm">T4 kill<input type="number" step="0.01" className="w-full rounded-sm bg-panel2 px-3 py-2 mt-1" value={t4} onChange={(e) => setT4(e.target.value)} /></label>
          <label className="text-sm">T5 kill<input type="number" step="0.01" className="w-full rounded-sm bg-panel2 px-3 py-2 mt-1" value={t5} onChange={(e) => setT5(e.target.value)} /></label>
          <label className="text-sm">Death<input type="number" step="0.01" className="w-full rounded-sm bg-panel2 px-3 py-2 mt-1" value={deathPts} onChange={(e) => setDeathPts(e.target.value)} /></label>
          <button className="col-span-3 bg-panel2 hover:bg-panel3 py-2 rounded-sm">Save point values</button>
        </form>
        {rulesMsg && <p className="text-sm text-steel">{rulesMsg}</p>}
      </section>

      <section className="bg-panel rounded-sm border border-hairline p-6 space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">Minimum requirements by power</h2>
        <p className="text-sm text-steel">
          Enter your existing tiers exactly like your "Minimum" sheet (min death count, min kill count per power bracket). The site converts these into a points target automatically using your point values above (min kills × T5 weight + min deaths × Death weight — same as your spreadsheet's Min. Contribution formula).
        </p>
        <form onSubmit={addRequirement} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input className="rounded-sm bg-panel2 px-3 py-2" placeholder="Min power" value={minPower} onChange={(e) => setMinPower(e.target.value)} required />
          <input className="rounded-sm bg-panel2 px-3 py-2" placeholder="Max power (blank = no cap)" value={maxPower} onChange={(e) => setMaxPower(e.target.value)} />
          <input className="rounded-sm bg-panel2 px-3 py-2" placeholder="Min deaths" value={minDeaths} onChange={(e) => setMinDeaths(e.target.value)} required />
          <input className="rounded-sm bg-panel2 px-3 py-2" placeholder="Min kills" value={minKills} onChange={(e) => setMinKills(e.target.value)} required />
          <button className="col-span-2 sm:col-span-4 bg-panel2 hover:bg-panel3 py-2 rounded-sm">Add tier</button>
        </form>
        {reqMsg && <p className="text-sm text-steel">{reqMsg}</p>}
        <ul className="text-sm space-y-1">
          {requirements.map((r) => (
            <li key={r.id} className="text-steel">
              {r.min_power.toLocaleString()} – {r.max_power ? r.max_power.toLocaleString() : "∞"} power → min {r.min_deaths.toLocaleString()} deaths, {r.min_kills.toLocaleString()} kills
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-panel rounded-sm border border-hairline p-6 space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">Pending farm-link requests</h2>
        {pendingLinks.length === 0 && <p className="text-sm text-steel">None right now.</p>}
        <ul className="space-y-2">
          {pendingLinks.map((l) => (
            <li key={l.id} className="flex items-center justify-between bg-panel2 rounded-sm px-3 py-2">
              <span className="text-sm">Main: {l.main_governor_id} ← Farm: {l.farm_governor_id}</span>
              <span className="flex gap-2">
                <button onClick={() => decideLink(l.id, "approved")} className="text-xs bg-drab hover:bg-drabBright text-ink font-semibold px-3 py-1 rounded">Approve</button>
                <button onClick={() => decideLink(l.id, "rejected")} className="text-xs bg-flare hover:bg-flareBright text-ink font-semibold px-3 py-1 rounded">Reject</button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-panel rounded-sm border border-hairline p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-wide text-paper">MGE applications</h2>
          <span className="font-data text-[10px] text-steelDim uppercase">Auto-deleted after 14 days</span>
        </div>
        <p className="text-xs text-steelDim">
          Share this link with players: <span className="font-data">yoursite.vercel.app/mge</span>. T4/T5 kills shown are from each applicant's most recent 3 KvKs.
        </p>
        {mgeLoading ? (
          <p className="text-sm text-steelDim">Loading...</p>
        ) : mgeApplications.length === 0 ? (
          <p className="text-sm text-steel">No applications right now.</p>
        ) : (
          <ul className="space-y-2">
            {mgeApplications.map((a) => (
              <li key={a.id} className="bg-panel2 rounded-sm border border-hairline px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-paper">{a.governor_name} <span className="font-data text-steelDim">({a.governor_id})</span></p>
                  <p className="font-data text-xs text-brassBright mt-0.5">
                    {a.vip_level ? `VIP ${a.vip_level}` : "VIP —"} · {a.mge_type || "—"}{a.commander ? ` · Wants: ${a.commander}` : ""}
                  </p>
                  {a.message && <p className="text-xs text-steel mt-0.5 italic">"{a.message}"</p>}
                  <ul className="mt-1 space-y-0.5">
                    {(a.killHistory || []).map((h) => (
                      <li key={h.eventName} className="font-data text-xs text-steel">
                        {h.eventName}: T4 {h.t4_kills.toLocaleString()} · T5 {h.t5_kills.toLocaleString()}
                        {!h.found && <span className="text-steelDim"> (not found)</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="font-data text-[10px] text-steelDim mt-1">
                    Applied {new Date(a.submitted_at).toLocaleDateString()} — screenshot (if any) was sent to Discord only, not stored here
                  </p>
                </div>
                <button onClick={() => deleteMgeApplication(a.id)} className="shrink-0 text-xs bg-flare hover:bg-flareBright text-ink font-semibold px-3 py-1 rounded">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-panel rounded-sm border border-hairline p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-wide text-paper">Fort tracker</h2>
          <button onClick={resetFortTracker} className="text-xs bg-flare hover:bg-flareBright text-ink font-semibold px-3 py-1.5 rounded">
            Reset off-season
          </button>
        </div>
        <p className="text-sm text-steel">
          Upload one week's fort sheet at a time. Columns expected: governor_id, name, started, completed, joined, Total (Total = completed + joined if not present). Reset clears every week — only do this when a new 8-week off-season begins.
        </p>
        <form onSubmit={uploadFort} className="space-y-3">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFortFile(e.target.files[0])} required className="text-sm" />
          <input className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2" placeholder={`Label (e.g. Week ${fortWeeks.length + 1})`}
            value={fortLabel} onChange={(e) => setFortLabel(e.target.value)} />
          <button className="bg-brass hover:bg-brassBright text-ink px-4 py-2 rounded-sm font-display uppercase tracking-wide">Upload</button>
        </form>
        {fortMsg && <p className="text-sm text-steel">{fortMsg}</p>}

        {fortWeeks.length > 0 && (
          <div className="pt-2">
            <p className="text-sm text-steel mb-2">Uploaded weeks this off-season ({fortWeeks.length} of 8):</p>
            <ul className="space-y-2">
              {fortWeeks.map((w) => (
                <li key={w.id} className="flex items-center justify-between bg-panel2 rounded-sm border border-hairline px-3 py-2">
                  <span className="text-sm">{w.label}</span>
                  <button onClick={() => deleteFortWeek(w.id)} className="text-xs bg-flare hover:bg-flareBright text-ink font-semibold px-3 py-1 rounded">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
