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

  useEffect(() => {
    if (loggedIn) {
      refreshEvents();
      refreshPendingLinks();
    }
  }, [loggedIn]);
  useEffect(() => {
    if (selectedEvent) refreshRequirements(selectedEvent);
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
        <form onSubmit={login} className="bg-slate-900 rounded-xl p-6 space-y-4">
          <h1 className="text-lg font-semibold">Admin login</h1>
          <input type="password" className="w-full rounded-lg bg-slate-800 px-3 py-2" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg font-medium">Log in</button>
        </form>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin panel</h1>
        <a href="/" className="text-sm text-slate-400 hover:text-slate-200">← Back to site</a>
      </header>

      <section className="bg-slate-900 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">KvK Events</h2>
        <form onSubmit={createEvent} className="flex gap-2">
          <input className="flex-1 rounded-lg bg-slate-800 px-3 py-2" placeholder="e.g. KvK Season 5"
            value={newEventName} onChange={(e) => setNewEventName(e.target.value)} required />
          <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg">Create</button>
        </form>
        <select className="w-full rounded-lg bg-slate-800 px-3 py-2" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}{ev.is_active ? " (active)" : ""}</option>)}
        </select>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            "Active" is the one governors see by default on the homepage. Uploading, point values, and requirements all still work on any event you pick above, active or not.
          </p>
          <button onClick={activateEvent} className="shrink-0 ml-3 text-xs bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 rounded whitespace-nowrap">
            Set as active
          </button>
        </div>
      </section>

      <section className="bg-slate-900 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Upload stats (Excel)</h2>
        <p className="text-sm text-slate-400">
          Columns expected: Governor ID, Name, Power, T4 Kills, T5 Kills, Deaths. Also picked up if present: Acclaims, Healed troops, Trades (shown as info only, not counted in points). Mark the very first upload of a KvK as "baseline" — every later upload is compared against it.
        </p>
        <form onSubmit={upload} className="space-y-3">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files[0])} required className="text-sm" />
          <input className="w-full rounded-lg bg-slate-800 px-3 py-2" placeholder="Label (e.g. Day 3)"
            value={label} onChange={(e) => setLabel(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isBaseline} onChange={(e) => setIsBaseline(e.target.checked)} />
            This is the baseline (first) snapshot for this KvK
          </label>
          <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium">Upload</button>
        </form>
        {uploadMsg && <p className="text-sm text-slate-300">{uploadMsg}</p>}
      </section>

      <section className="bg-slate-900 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Point values</h2>
        <form onSubmit={saveRules} className="grid grid-cols-3 gap-3">
          <label className="text-sm">T4 kill<input type="number" step="0.01" className="w-full rounded-lg bg-slate-800 px-3 py-2 mt-1" value={t4} onChange={(e) => setT4(e.target.value)} /></label>
          <label className="text-sm">T5 kill<input type="number" step="0.01" className="w-full rounded-lg bg-slate-800 px-3 py-2 mt-1" value={t5} onChange={(e) => setT5(e.target.value)} /></label>
          <label className="text-sm">Death<input type="number" step="0.01" className="w-full rounded-lg bg-slate-800 px-3 py-2 mt-1" value={deathPts} onChange={(e) => setDeathPts(e.target.value)} /></label>
          <button className="col-span-3 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg">Save point values</button>
        </form>
        {rulesMsg && <p className="text-sm text-slate-300">{rulesMsg}</p>}
      </section>

      <section className="bg-slate-900 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Minimum requirements by power</h2>
        <p className="text-sm text-slate-400">
          Enter your existing tiers exactly like your "Minimum" sheet (min death count, min kill count per power bracket). The site converts these into a points target automatically using your point values above (min kills × T5 weight + min deaths × Death weight — same as your spreadsheet's Min. Contribution formula).
        </p>
        <form onSubmit={addRequirement} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input className="rounded-lg bg-slate-800 px-3 py-2" placeholder="Min power" value={minPower} onChange={(e) => setMinPower(e.target.value)} required />
          <input className="rounded-lg bg-slate-800 px-3 py-2" placeholder="Max power (blank = no cap)" value={maxPower} onChange={(e) => setMaxPower(e.target.value)} />
          <input className="rounded-lg bg-slate-800 px-3 py-2" placeholder="Min deaths" value={minDeaths} onChange={(e) => setMinDeaths(e.target.value)} required />
          <input className="rounded-lg bg-slate-800 px-3 py-2" placeholder="Min kills" value={minKills} onChange={(e) => setMinKills(e.target.value)} required />
          <button className="col-span-2 sm:col-span-4 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg">Add tier</button>
        </form>
        {reqMsg && <p className="text-sm text-slate-300">{reqMsg}</p>}
        <ul className="text-sm space-y-1">
          {requirements.map((r) => (
            <li key={r.id} className="text-slate-300">
              {r.min_power.toLocaleString()} – {r.max_power ? r.max_power.toLocaleString() : "∞"} power → min {r.min_deaths.toLocaleString()} deaths, {r.min_kills.toLocaleString()} kills
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-slate-900 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Pending farm-link requests</h2>
        {pendingLinks.length === 0 && <p className="text-sm text-slate-400">None right now.</p>}
        <ul className="space-y-2">
          {pendingLinks.map((l) => (
            <li key={l.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
              <span className="text-sm">Main: {l.main_governor_id} ← Farm: {l.farm_governor_id}</span>
              <span className="flex gap-2">
                <button onClick={() => decideLink(l.id, "approved")} className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded">Approve</button>
                <button onClick={() => decideLink(l.id, "rejected")} className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1 rounded">Reject</button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
