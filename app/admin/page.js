"use client";

import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { formatCompact } from "../../lib/points";
import { getKvkEvents, getPointRules, getRequirements } from "../../lib/kvkHistory";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [events, setEvents] = useState([]);
  const [newEventName, setNewEventName] = useState("");

  const [uploadEventId, setUploadEventId] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadIsBaseline, setUploadIsBaseline] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  // Point rules and requirement tiers are both scoped PER KVK EVENT in the
  // real schema, so both sections share one "which KvK am I configuring"
  // selector rather than editing one global config.
  const [configEventId, setConfigEventId] = useState("");
  const [rules, setRules] = useState({ t4_weight: 10, t5_weight: 12, death_weight: 60 });
  const [requirements, setRequirements] = useState([]);
  const [rulesMsg, setRulesMsg] = useState("");
  const [reqMsg, setReqMsg] = useState("");

  const [links, setLinks] = useState([]);

  const [mgeApps, setMgeApps] = useState([]);
  const [mgeHistory, setMgeHistory] = useState({});

  const [fortLabel, setFortLabel] = useState("");
  const [fortFile, setFortFile] = useState(null);
  const [fortMsg, setFortMsg] = useState("");

  const [reminderMsg, setReminderMsg] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  async function refreshAll() {
    const ev = await getKvkEvents();
    setEvents(ev);
    if (ev.length && !configEventId) {
      const active = ev.find((e) => e.is_active) || ev[ev.length - 1];
      setConfigEventId(active.id);
    }

    const linksRes = await fetch("/api/admin/farm-links");
    if (linksRes.ok) setLinks((await linksRes.json()).links || []);

    const mgeRes = await fetch("/api/admin/mge-applications");
    if (mgeRes.ok) {
      const json = await mgeRes.json();
      setMgeApps(json.applications || []);
      setMgeHistory(json.history || {});
    }
  }

  useEffect(() => {
    if (authed) refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // Load this KvK's point rules + requirement tiers whenever the config
  // selector changes (including the first time it's set above).
  useEffect(() => {
    if (!configEventId) return;
    (async () => {
      const [pr, rq] = await Promise.all([getPointRules(configEventId), getRequirements(configEventId)]);
      setRules(pr);
      setRequirements(rq);
    })();
  }, [configEventId]);

  async function login(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setLoginError("Wrong password");
  }

  async function createEvent(e) {
    e.preventDefault();
    const res = await fetch("/api/admin/create-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newEventName }),
    });
    if (res.ok) {
      setNewEventName("");
      refreshAll();
    }
  }

  async function activateEvent(id) {
    await fetch("/api/admin/activate-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kvk_event_id: id }),
    });
    refreshAll();
  }

  async function submitUpload(e) {
    e.preventDefault();
    setUploadMsg("");
    if (!uploadFile || !uploadEventId) {
      setUploadMsg("Pick a KvK event and a file.");
      return;
    }
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("kvk_event_id", uploadEventId);
    fd.append("label", uploadLabel || "Snapshot");
    fd.append("is_baseline", String(uploadIsBaseline));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploadMsg(json.ok ? `Saved ${json.rows_saved} rows.${json.warning ? " " + json.warning : ""}` : json.error);
  }

  async function saveRules(e) {
    e.preventDefault();
    setRulesMsg("");
    if (!configEventId) {
      setRulesMsg("Pick a KvK to configure first.");
      return;
    }
    const res = await fetch("/api/admin/point-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kvk_event_id: configEventId, ...rules }),
    });
    const json = await res.json();
    setRulesMsg(json.ok ? "Saved." : json.error || "Something went wrong.");
  }

  function updateTier(i, field, value) {
    const copy = [...requirements];
    copy[i] = { ...copy[i], [field]: value === "" ? null : Number(value) };
    setRequirements(copy);
  }

  function addTier() {
    setRequirements([...requirements, { min_power: 0, max_power: null, min_deaths: 0, min_kills: 0 }]);
  }

  function removeTier(i) {
    setRequirements(requirements.filter((_, idx) => idx !== i));
  }

  async function saveRequirements() {
    setReqMsg("");
    if (!configEventId) {
      setReqMsg("Pick a KvK to configure first.");
      return;
    }
    const res = await fetch("/api/admin/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kvk_event_id: configEventId, requirements }),
    });
    const json = await res.json();
    setReqMsg(json.ok ? "Saved." : json.error || "Something went wrong.");
    if (json.ok) {
      const rq = await getRequirements(configEventId);
      setRequirements(rq);
    }
  }

  async function setLinkStatus(id, status) {
    await fetch("/api/admin/farm-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    refreshAll();
  }

  async function submitFort(e) {
    e.preventDefault();
    setFortMsg("");
    if (!fortFile) {
      setFortMsg("Pick a file.");
      return;
    }
    const fd = new FormData();
    fd.append("file", fortFile);
    fd.append("label", fortLabel || "Week");
    const res = await fetch("/api/fort/upload", { method: "POST", body: fd });
    const json = await res.json();
    setFortMsg(json.ok ? `Saved ${json.rows_saved} rows.` : json.error);
  }

  async function resetFort() {
    if (!confirm("Reset the entire off-season? This deletes all fort weeks.")) return;
    await fetch("/api/admin/fort-reset", { method: "POST" });
    setFortMsg("Off-season reset.");
  }

  async function sendReminder() {
    setSendingReminder(true);
    setReminderMsg("");
    const res = await fetch("/api/admin/send-reminder", { method: "POST" });
    const json = await res.json();
    setSendingReminder(false);
    setReminderMsg(json.ok ? `Sent (${json.sent || 0} governors flagged).` : json.error);
  }

  if (!authed) {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="max-w-sm mx-auto px-6 py-20">
          <form onSubmit={login} className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
            <h1 className="font-display text-xl text-brassBright text-center">ADMIN LOGIN</h1>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-brass hover:bg-brassBright text-ink font-display tracking-wide px-6 py-2 rounded">
              LOG IN
            </button>
            {loginError && <p className="text-flareBright text-sm text-center">{loginError}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <h1 className="font-display text-3xl text-brassBright text-center tracking-widest">ADMIN</h1>

        {/* KvK Events */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg text-brassBright">KvK Events</h2>
          <ul className="space-y-2 font-mono text-sm">
            {events.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between bg-panel2 rounded px-4 py-2">
                <span>
                  {ev.name} {ev.is_active && <span className="text-drabBright">(active)</span>}
                </span>
                {!ev.is_active && (
                  <button onClick={() => activateEvent(ev.id)} className="text-brass hover:text-brassBright text-xs">
                    Set as active
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={createEvent} className="flex gap-3">
            <input
              placeholder="New KvK name"
              className="flex-1 bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
            />
            <button className="bg-brass hover:bg-brassBright text-ink font-display px-4 py-2 rounded">Create</button>
          </form>
        </section>

        {/* Upload stats */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg text-brassBright">Upload Stats</h2>
          <form onSubmit={submitUpload} className="space-y-3">
            <select
              className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
              value={uploadEventId}
              onChange={(e) => setUploadEventId(e.target.value)}
            >
              <option value="">Select KvK event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Label (e.g. Scan 3)"
              className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-steel">
              <input type="checkbox" checked={uploadIsBaseline} onChange={(e) => setUploadIsBaseline(e.target.checked)} />
              This is the baseline (matchmaking) snapshot
            </label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            <button className="bg-brass hover:bg-brassBright text-ink font-display px-4 py-2 rounded">Upload</button>
            {uploadMsg && <p className="text-sm text-steel">{uploadMsg}</p>}
          </form>
        </section>

        {/* Which KvK's point rules / requirements are being edited */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-3">
          <h2 className="font-display text-lg text-brassBright">Configuring KvK</h2>
          <p className="text-steel text-sm">
            Point values and minimum requirements are set per KvK event — pick which one to edit below.
          </p>
          <select
            className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={configEventId}
            onChange={(e) => setConfigEventId(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} {ev.is_active ? "★" : ""}
              </option>
            ))}
          </select>
        </section>

        {/* Point values */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg text-brassBright">Point Values</h2>
          <form onSubmit={saveRules} className="grid grid-cols-3 gap-3">
            {["t4_weight", "t5_weight", "death_weight"].map((f) => (
              <div key={f}>
                <label className="text-xs text-steelDim uppercase block mb-1">{f.replace("_", " ")}</label>
                <input
                  type="number"
                  className="w-full bg-panel2 border border-hairline rounded px-3 py-2 font-mono text-paper"
                  value={rules[f]}
                  onChange={(e) => setRules({ ...rules, [f]: Number(e.target.value) })}
                />
              </div>
            ))}
            <button className="col-span-3 bg-brass hover:bg-brassBright text-ink font-display px-4 py-2 rounded">
              Save
            </button>
            {rulesMsg && <p className="col-span-3 text-sm text-steel">{rulesMsg}</p>}
          </form>
        </section>

        {/* Minimum requirements */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg text-brassBright">Minimum Requirements</h2>
          <div className="space-y-2">
            {requirements.map((r, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min power"
                  className="bg-panel2 border border-hairline rounded px-3 py-2 font-mono text-sm text-paper"
                  value={r.min_power ?? ""}
                  onChange={(e) => updateTier(i, "min_power", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max power"
                  className="bg-panel2 border border-hairline rounded px-3 py-2 font-mono text-sm text-paper"
                  value={r.max_power ?? ""}
                  onChange={(e) => updateTier(i, "max_power", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Min deaths"
                  className="bg-panel2 border border-hairline rounded px-3 py-2 font-mono text-sm text-paper"
                  value={r.min_deaths ?? ""}
                  onChange={(e) => updateTier(i, "min_deaths", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Min kills"
                  className="bg-panel2 border border-hairline rounded px-3 py-2 font-mono text-sm text-paper"
                  value={r.min_kills ?? ""}
                  onChange={(e) => updateTier(i, "min_kills", e.target.value)}
                />
                <button onClick={() => removeTier(i)} className="text-flareBright text-xs">
                  Remove
                </button>
              </div>
            ))}
            {requirements.length === 0 && <p className="text-steelDim text-sm">No tiers yet for this KvK.</p>}
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={addTier} className="bg-panel2 border border-hairline text-paper px-4 py-2 rounded text-sm">
              + Add tier
            </button>
            <button onClick={saveRequirements} className="bg-brass hover:bg-brassBright text-ink font-display px-4 py-2 rounded">
              Save tiers
            </button>
            {reqMsg && <p className="text-sm text-steel">{reqMsg}</p>}
          </div>
        </section>

        {/* Farm link requests */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg text-brassBright">Farm Link Requests</h2>
          <ul className="space-y-2 font-mono text-sm">
            {links.map((l) => (
              <li key={l.id} className="flex items-center justify-between bg-panel2 rounded px-4 py-2">
                <span>
                  {l.farm_governor_id} → {l.main_governor_id}{" "}
                  <span className="text-steelDim">({l.status})</span>
                </span>
                {l.status === "pending" && (
                  <span className="flex gap-2">
                    <button onClick={() => setLinkStatus(l.id, "approved")} className="text-drabBright text-xs">
                      Approve
                    </button>
                    <button onClick={() => setLinkStatus(l.id, "rejected")} className="text-flareBright text-xs">
                      Reject
                    </button>
                  </span>
                )}
              </li>
            ))}
            {links.length === 0 && <p className="text-steelDim text-sm">No requests.</p>}
          </ul>
        </section>

        {/* MGE applications */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg text-brassBright">MGE Applications</h2>
          <ul className="space-y-3 font-mono text-sm">
            {mgeApps.map((a) => (
              <li key={a.id} className="bg-panel2 rounded px-4 py-3">
                <div className="flex justify-between">
                  <span>
                    {a.governor_name} ({a.governor_id}) — VIP {a.vip} — {a.mge_type}
                  </span>
                  <span className="text-steelDim text-xs">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                {a.commander && <div className="text-steel text-xs mt-1">Wants: {a.commander}</div>}
                {a.message && <div className="text-steel text-xs">Msg: {a.message}</div>}
                {mgeHistory[a.governor_id]?.length > 0 && (
                  <div className="text-xs text-brass mt-1">
                    {mgeHistory[a.governor_id]
                      .map((h) => `${h.kvk}: T4 ${formatCompact(h.t4_kills)} / T5 ${formatCompact(h.t5_kills)}`)
                      .join(" · ")}
                  </div>
                )}
              </li>
            ))}
            {mgeApps.length === 0 && <p className="text-steelDim text-sm">No applications in the last 14 days.</p>}
          </ul>
        </section>

        {/* Fort tracker */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg text-brassBright">Fort Tracker</h2>
          <form onSubmit={submitFort} className="space-y-3">
            <input
              placeholder="Week label (e.g. Week 3)"
              className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
              value={fortLabel}
              onChange={(e) => setFortLabel(e.target.value)}
            />
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFortFile(e.target.files?.[0] || null)} />
            <div className="flex gap-3">
              <button className="bg-brass hover:bg-brassBright text-ink font-display px-4 py-2 rounded">
                Upload week
              </button>
              <button type="button" onClick={resetFort} className="bg-flare hover:bg-flareBright text-ink font-display px-4 py-2 rounded">
                Reset off-season
              </button>
            </div>
            {fortMsg && <p className="text-sm text-steel">{fortMsg}</p>}
          </form>
        </section>

        {/* Kingsland Reminder */}
        <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
          <h2 className="font-display text-lg text-brassBright">Kingsland Reminder</h2>
          <p className="text-steel text-sm">
            Pings @everyone in the announcement channel with every governor above 55M power who hasn&apos;t met the
            active KvK&apos;s minimum yet.
          </p>
          <button
            onClick={sendReminder}
            disabled={sendingReminder}
            className="bg-flare hover:bg-flareBright text-ink font-display px-6 py-2 rounded disabled:opacity-50"
          >
            {sendingReminder ? "SENDING…" : "SEND REMINDER"}
          </button>
          {reminderMsg && <p className="text-sm text-steel">{reminderMsg}</p>}
        </section>
      </div>
    </main>
  );
}
