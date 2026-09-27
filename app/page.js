"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import SearchBox from "../components/SearchBox";
import BarCompareChart from "../components/BarCompareChart";
import StatsCharts from "../components/StatsCharts";
import { formatCompact } from "../lib/points";
import { aggregateGovernors } from "../lib/aggregate";
import {
  getKvkEvents,
  getSnapshots,
  getGovernorStats,
  getApprovedLinks,
  getPointRules,
  getRequirements,
  loadSnapshotPair,
} from "../lib/kvkHistory";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [links, setLinks] = useState([]);
  const [rules, setRules] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [rows, setRows] = useState([]); // aggregated governors for selected KvK+snapshot
  const [loading, setLoading] = useState(true);

  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [progressData, setProgressData] = useState([]);

  const [compareEventId, setCompareEventId] = useState("");
  const [compareData, setCompareData] = useState(null);

  const [farmForm, setFarmForm] = useState({ main_governor_id: "", farm_governor_id: "" });
  const [farmMsg, setFarmMsg] = useState("");

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [ev, lk, pr, rq] = await Promise.all([getKvkEvents(), getApprovedLinks(), getPointRules(), getRequirements()]);
      setEvents(ev);
      setLinks(lk);
      setRules(pr);
      setRequirements(rq);
      const active = ev.find((e) => e.is_active) || ev[ev.length - 1];
      if (active) {
        setSelectedEventId(active.id);
        const snaps = await getSnapshots(active.id);
        setSnapshots(snaps);
        if (snaps.length) setSelectedSnapshotId(snaps[snaps.length - 1].id);
      }
      setLoading(false);
    })();
  }, []);

  // When event changes, reload its snapshots
  useEffect(() => {
    if (!selectedEventId) return;
    (async () => {
      const snaps = await getSnapshots(selectedEventId);
      setSnapshots(snaps);
      setSelectedSnapshotId(snaps.length ? snaps[snaps.length - 1].id : "");
    })();
  }, [selectedEventId]);

  // Recompute the aggregated leaderboard whenever selection changes
  useEffect(() => {
    if (!selectedSnapshotId || !snapshots.length) {
      setRows([]);
      return;
    }
    (async () => {
      const { baselineRows, latestRows } = await loadSnapshotPair(snapshots, selectedSnapshotId);
      setRows(aggregateGovernors(baselineRows, latestRows, links, rules, requirements));
    })();
  }, [selectedSnapshotId, snapshots, links, rules, requirements]);

  const allianceTotals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.t4_kills += r.t4_kills;
        acc.t5_kills += r.t5_kills;
        acc.deaths += r.deaths;
        acc.points += r.points;
        return acc;
      },
      { t4_kills: 0, t5_kills: 0, deaths: 0, points: 0 }
    );
  }, [rows]);

  const top15Kills = useMemo(
    () => [...rows].sort((a, b) => b.t4_kills + b.t5_kills - (a.t4_kills + a.t5_kills)).slice(0, 15),
    [rows]
  );
  const top10Deaths = useMemo(() => [...rows].sort((a, b) => b.deaths - a.deaths).slice(0, 10), [rows]);

  const governorOptions = useMemo(() => rows.map((r) => ({ id: r.id, name: r.name })), [rows]);

  async function runSearch(query) {
    setSearchError("");
    setSearchResult(null);
    setProgressData([]);
    if (!query) return;
    const q = query.trim().toLowerCase();
    const match = rows.find((r) => r.id === query.trim()) || rows.find((r) => r.name.toLowerCase() === q);
    if (!match) {
      const partial = rows.filter((r) => r.name.toLowerCase().includes(q));
      if (partial.length === 1) {
        setSearchResult(partial[0]);
      } else if (partial.length > 1) {
        setSearchError(`Multiple matches — try their full Governor ID. (${partial.map((p) => p.name).join(", ")})`);
      } else {
        setSearchError("No governor found with that ID or name in this snapshot.");
      }
      return;
    }
    setSearchResult(match);

    // Build a per-snapshot progress chart across this KvK
    const data = [];
    for (const snap of snapshots) {
      const { baselineRows, latestRows } = await loadSnapshotPair(snapshots, snap.id);
      const snapRows = aggregateGovernors(baselineRows, latestRows, links, rules, requirements);
      const r = snapRows.find((x) => x.id === match.id);
      data.push({
        label: snap.label,
        t4_kills: r ? Math.round(r.t4_kills) : 0,
        t5_kills: r ? Math.round(r.t5_kills) : 0,
        deaths: r ? Math.round(r.deaths) : 0,
      });
    }
    setProgressData(data);
  }

  async function loadCompare(eventId) {
    setCompareEventId(eventId);
    if (!eventId || !selectedEventId) {
      setCompareData(null);
      return;
    }
    const [snapsA, snapsB] = await Promise.all([getSnapshots(selectedEventId), getSnapshots(eventId)]);
    const [pairA, pairB] = await Promise.all([
      loadSnapshotPair(snapsA, snapsA[snapsA.length - 1]?.id),
      loadSnapshotPair(snapsB, snapsB[snapsB.length - 1]?.id),
    ]);
    const rowsA = aggregateGovernors(pairA.baselineRows, pairA.latestRows, links, rules, requirements);
    const rowsB = aggregateGovernors(pairB.baselineRows, pairB.latestRows, links, rules, requirements);
    const sum = (arr, f) => arr.reduce((a, r) => a + r[f], 0);
    const eventA = events.find((e) => e.id === selectedEventId);
    const eventB = events.find((e) => e.id === eventId);
    setCompareData({
      nameA: eventA?.name || "This KvK",
      nameB: eventB?.name || "Other KvK",
      data: [
        { metric: "T4 Kills", A: Math.round(sum(rowsA, "t4_kills")), B: Math.round(sum(rowsB, "t4_kills")) },
        { metric: "T5 Kills", A: Math.round(sum(rowsA, "t5_kills")), B: Math.round(sum(rowsB, "t5_kills")) },
        { metric: "Deaths", A: Math.round(sum(rowsA, "deaths")), B: Math.round(sum(rowsB, "deaths")) },
        { metric: "Points", A: Math.round(sum(rowsA, "points")), B: Math.round(sum(rowsB, "points")) },
      ],
    });
  }

  async function submitFarmLink(e) {
    e.preventDefault();
    setFarmMsg("");
    const res = await fetch("/api/farm-link-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(farmForm),
    });
    const json = await res.json();
    setFarmMsg(json.ok ? "Request sent — an admin will review it." : json.error || "Something went wrong.");
    if (json.ok) setFarmForm({ main_governor_id: "", farm_governor_id: "" });
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        <header className="text-center space-y-3">
          <h1 className="font-display text-5xl tracking-[0.15em] text-brassBright">KINGDOM 2194</h1>
          <p className="text-steel font-body text-lg">Alliance KvK Ledger</p>
        </header>

        {/* KvK / snapshot picker */}
        <section className="flex flex-wrap gap-4 items-center justify-center">
          <select
            className="bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} {ev.is_active ? "★" : ""}
              </option>
            ))}
          </select>
          <select
            className="bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={selectedSnapshotId}
            onChange={(e) => setSelectedSnapshotId(e.target.value)}
          >
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} {s.is_baseline ? "(baseline)" : ""}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <p className="text-center text-steel font-mono">Loading the ledger…</p>
        ) : (
          <>
            {/* Alliance totals */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["T4 Kills", allianceTotals.t4_kills],
                ["T5 Kills", allianceTotals.t5_kills],
                ["Deaths", allianceTotals.deaths],
                ["Points", allianceTotals.points],
              ].map(([label, val]) => (
                <div key={label} className="bg-panel border border-hairline rounded-lg p-5 text-center">
                  <div className="text-xs tracking-widest text-steelDim uppercase">{label}</div>
                  <div className="font-mono text-2xl text-brassBright mt-1">{formatCompact(val)}</div>
                </div>
              ))}
            </section>

            {/* Search */}
            <section className="bg-panel border border-hairline rounded-lg p-6 space-y-5">
              <h2 className="font-display text-xl tracking-widest text-brassBright">CHECK YOUR STATS</h2>
              <SearchBox governors={governorOptions} onPick={runSearch} />
              {searchError && <p className="text-flareBright font-mono text-sm">{searchError}</p>}
              {searchResult && (
                <div className="space-y-5">
                  <p className="text-steel text-sm">
                    {selectedEvent?.name} — comparing &quot;MatchMaking Power&quot; to &quot;Snapshot&quot;
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      ["Power", searchResult.power],
                      ["T4 Kills", searchResult.t4_kills],
                      ["T5 Kills", searchResult.t5_kills],
                      ["Deaths", searchResult.deaths],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-panel2 border border-hairline rounded-lg p-4">
                        <div className="text-xs tracking-widest text-steelDim uppercase">{label}</div>
                        <div className="font-mono text-xl text-paper mt-1">{Math.round(val).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-steelDim uppercase tracking-widest">Not counted toward points — informational only</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      ["Acclaims", searchResult.acclaims],
                      ["Healed Troops", searchResult.healed_troops],
                      ["Trades", searchResult.trades],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-panel2 border border-hairline rounded-lg p-4">
                        <div className="text-xs tracking-widest text-steelDim uppercase">{label}</div>
                        <div className="font-mono text-xl text-paper mt-1">{Math.round(val).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-panel2 border border-hairline rounded-lg p-6 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="text-xs tracking-widest text-steelDim uppercase">Points Earned</div>
                      <div className="font-mono text-3xl text-paper">{searchResult.points.toLocaleString()}</div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xs tracking-widest text-steelDim uppercase">
                        Required{" "}
                        <span className="font-mono text-drabBright">{Math.round(searchResult.required).toLocaleString()}</span>
                      </div>
                      <div className={`stamp ${searchResult.pass ? "text-drabBright" : "text-flareBright"}`}>
                        {searchResult.pass ? "PASS" : "BELOW MIN"}
                      </div>
                      {searchResult.tier?.__belowLowest && (
                        <div className="text-xs text-steelDim">Power below lowest tier — no requirement</div>
                      )}
                    </div>
                  </div>
                  {searchResult.linkedFarms?.length > 0 && (
                    <div>
                      <p className="text-sm text-steel mb-1">Linked accounts included:</p>
                      <ul className="text-sm font-mono text-brass space-y-1">
                        <li>{searchResult.name} ({searchResult.id}) — main</li>
                        {searchResult.linkedFarms.map((f) => (
                          <li key={f.id}>
                            {f.name} ({f.id}) — farm, counted at 20%
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {progressData.length > 1 && (
                    <div>
                      <p className="text-sm text-steel mb-2">Progress this KvK</p>
                      <StatsCharts data={progressData} />
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Leaderboards */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="bg-panel border border-hairline rounded-lg p-6">
                <h2 className="font-display text-lg tracking-widest text-brassBright mb-4">TOP 15 — KILLS</h2>
                <ol className="space-y-2 font-mono text-sm">
                  {top15Kills.map((r, i) => (
                    <li key={r.id} className="flex justify-between border-b border-hairline/50 pb-1">
                      <span>
                        <span className="text-steelDim mr-2">{i + 1}.</span>
                        {r.name}
                      </span>
                      <span className="text-brassBright">{formatCompact(r.t4_kills + r.t5_kills)}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-panel border border-hairline rounded-lg p-6">
                <h2 className="font-display text-lg tracking-widest text-brassBright mb-4">TOP 10 — DEATHS</h2>
                <ol className="space-y-2 font-mono text-sm">
                  {top10Deaths.map((r, i) => (
                    <li key={r.id} className="flex justify-between border-b border-hairline/50 pb-1">
                      <span>
                        <span className="text-steelDim mr-2">{i + 1}.</span>
                        {r.name}
                      </span>
                      <span className="text-flareBright">{formatCompact(r.deaths)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* KvK comparison */}
            <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
              <h2 className="font-display text-lg tracking-widest text-brassBright">COMPARE KvKs</h2>
              <select
                className="bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
                value={compareEventId}
                onChange={(e) => loadCompare(e.target.value)}
              >
                <option value="">Select a KvK to compare against {selectedEvent?.name || "this one"}…</option>
                {events
                  .filter((e) => e.id !== selectedEventId)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
              {compareData && <BarCompareChart data={compareData.data} nameA={compareData.nameA} nameB={compareData.nameB} />}
            </section>

            {/* Farm link request */}
            <section className="bg-panel border border-hairline rounded-lg p-6 space-y-4 max-w-xl mx-auto">
              <h2 className="font-display text-lg tracking-widest text-brassBright">LINK A FARM ACCOUNT</h2>
              <form onSubmit={submitFarmLink} className="space-y-3">
                <input
                  required
                  placeholder="Your main Governor ID"
                  className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
                  value={farmForm.main_governor_id}
                  onChange={(e) => setFarmForm({ ...farmForm, main_governor_id: e.target.value })}
                />
                <input
                  required
                  placeholder="Farm account Governor ID"
                  className="w-full bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
                  value={farmForm.farm_governor_id}
                  onChange={(e) => setFarmForm({ ...farmForm, farm_governor_id: e.target.value })}
                />
                <button className="bg-brass hover:bg-brassBright text-ink font-display tracking-wide px-6 py-2 rounded">
                  REQUEST LINK
                </button>
                {farmMsg && <p className="text-sm text-steel">{farmMsg}</p>}
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
