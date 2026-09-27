"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../../components/NavBar";
import SearchBox from "../../components/SearchBox";
import { formatCompact } from "../../lib/points";
import { aggregateGovernors } from "../../lib/aggregate";
import {
  getKvkEvents,
  getSnapshots,
  getApprovedLinks,
  getPointRules,
  getRequirements,
  loadSnapshotPair,
} from "../../lib/kvkHistory";

export default function RankingsPage() {
  const [events, setEvents] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [ev, lk, pr, rq] = await Promise.all([getKvkEvents(), getApprovedLinks(), getPointRules(), getRequirements()]);
      setEvents(ev);
      const active = ev.find((e) => e.is_active) || ev[ev.length - 1];
      if (active) {
        setSelectedEventId(active.id);
        const snaps = await getSnapshots(active.id);
        setSnapshots(snaps);
        if (snaps.length) {
          const lastId = snaps[snaps.length - 1].id;
          setSelectedSnapshotId(lastId);
          const { baselineRows, latestRows } = await loadSnapshotPair(snaps, lastId);
          setRows(aggregateGovernors(baselineRows, latestRows, lk, pr, rq).sort((a, b) => b.points - a.points));
        }
      }
      window.__k2194_links = lk;
      window.__k2194_rules = pr;
      window.__k2194_req = rq;
      setLoading(false);
    })();
  }, []);

  async function changeEvent(eventId) {
    setSelectedEventId(eventId);
    const snaps = await getSnapshots(eventId);
    setSnapshots(snaps);
    const lastId = snaps.length ? snaps[snaps.length - 1].id : "";
    setSelectedSnapshotId(lastId);
    if (lastId) await recompute(snaps, lastId);
  }

  async function changeSnapshot(snapshotId) {
    setSelectedSnapshotId(snapshotId);
    await recompute(snapshots, snapshotId);
  }

  async function recompute(snaps, snapshotId) {
    const { baselineRows, latestRows } = await loadSnapshotPair(snaps, snapshotId);
    setRows(
      aggregateGovernors(baselineRows, latestRows, window.__k2194_links, window.__k2194_rules, window.__k2194_req).sort(
        (a, b) => b.points - a.points
      )
    );
  }

  const top300 = useMemo(() => rows.slice(0, 300), [rows]);
  const governorOptions = useMemo(() => rows.map((r) => ({ id: r.id, name: r.name })), [rows]);

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="font-display text-4xl tracking-[0.15em] text-brassBright">CONTRIBUTION RANKINGS</h1>
          <p className="text-steel">Top 300 governors, kingdom-wide, by points</p>
        </header>

        <div className="flex flex-wrap gap-4 justify-center">
          <select
            className="bg-panel2 border border-hairline rounded px-4 py-2 font-mono text-paper"
            value={selectedEventId}
            onChange={(e) => changeEvent(e.target.value)}
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
            onChange={(e) => changeSnapshot(e.target.value)}
          >
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} {s.is_baseline ? "(baseline)" : ""}
              </option>
            ))}
          </select>
        </div>

        <SearchBox governors={governorOptions} onPick={setHighlightId} placeholder="Jump to your name…" />

        {loading ? (
          <p className="text-center text-steel font-mono">Loading rankings…</p>
        ) : (
          <div className="bg-panel border border-hairline rounded-lg overflow-hidden">
            <table className="w-full font-mono text-sm">
              <thead className="bg-panel2 text-steelDim uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Governor</th>
                  <th className="text-right px-4 py-3">Points</th>
                  <th className="text-right px-4 py-3">Required</th>
                  <th className="text-right px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {top300.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-t border-hairline/50 ${r.id === highlightId ? "bg-brass/10" : ""}`}
                  >
                    <td className="px-4 py-2 text-steelDim">{i + 1}</td>
                    <td className="px-4 py-2 text-paper">
                      {r.name} <span className="text-steelDim">({r.id})</span>
                    </td>
                    <td className="px-4 py-2 text-right text-brassBright">{formatCompact(r.points)}</td>
                    <td className="px-4 py-2 text-right text-steel">{formatCompact(r.required)}</td>
                    <td className={`px-4 py-2 text-right ${r.pass ? "text-drabBright" : "text-flareBright"}`}>
                      {r.pass ? "PASS" : "BELOW MIN"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
