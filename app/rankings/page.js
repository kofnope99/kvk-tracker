"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  const [loadError, setLoadError] = useState("");
  const [highlightId, setHighlightId] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [ev, lk] = await Promise.all([getKvkEvents(), getApprovedLinks()]);
        setEvents(ev);
        window.__k2194_links = lk;
        if (!ev.length) {
          setLoadError("No KvK events found yet — create one in the admin panel.");
          return;
        }
        const active = ev.find((e) => e.is_active) || ev[ev.length - 1];
        setSelectedEventId(active.id);
        await loadForEvent(active, lk);
      } catch (err) {
        console.error(err);
        setLoadError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Snapshots, point rules and requirement tiers are all scoped per KvK
  // event — reload them together whenever the selected event changes.
  async function loadForEvent(event, links) {
    const [snaps, pr, rq] = await Promise.all([
      getSnapshots(event.id),
      getPointRules(event.id),
      getRequirements(event.id),
    ]);
    setSnapshots(snaps);
    window.__k2194_rules = pr;
    window.__k2194_req = rq;
    if (!snaps.length) {
      setLoadError(`"${event.name}" has no snapshots uploaded yet.`);
      setSelectedSnapshotId("");
      setRows([]);
      return;
    }
    const lastId = snaps[snaps.length - 1].id;
    setSelectedSnapshotId(lastId);
    const { baselineRows, latestRows } = await loadSnapshotPair(snaps, lastId);
    setRows(aggregateGovernors(baselineRows, latestRows, links, pr, rq).sort((a, b) => b.points - a.points));
  }

  async function changeEvent(eventId) {
    setSelectedEventId(eventId);
    setLoading(true);
    setLoadError("");
    try {
      const event = events.find((e) => e.id === eventId);
      await loadForEvent(event, window.__k2194_links);
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function changeSnapshot(snapshotId) {
    setSelectedSnapshotId(snapshotId);
    await recompute(snapshots, snapshotId);
  }

  async function recompute(snaps, snapshotId) {
    try {
      const { baselineRows, latestRows } = await loadSnapshotPair(snaps, snapshotId);
      setRows(
        aggregateGovernors(baselineRows, latestRows, window.__k2194_links, window.__k2194_rules, window.__k2194_req).sort(
          (a, b) => b.points - a.points
        )
      );
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || String(err));
    }
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
        ) : loadError ? (
          <p className="text-center text-flareBright font-mono">{loadError}</p>
        ) : (
          <div className="bg-panel border border-hairline rounded-lg overflow-hidden">
            <table className="w-full font-mono text-sm">
              <thead className="bg-panel2 text-steelDim uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Governor</th>
                  <th className="text-right px-4 py-3">Total Kills</th>
                  <th className="text-right px-4 py-3">Deaths</th>
                  <th className="text-right px-4 py-3">Points</th>
                  <th className="text-right px-4 py-3">Required</th>
                  <th className="text-right px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {top300.map((r, i) => (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`border-t border-hairline/50 ${r.id === highlightId ? "bg-brass/10" : ""}`}
                    >
                      <td className="px-4 py-2 text-steelDim">{i + 1}</td>
                      <td className="px-4 py-2 text-paper">
                        {r.name} <span className="text-steelDim">({r.id})</span>
                      </td>
                      <td className="px-4 py-2 text-right text-paper">
                        {formatCompact(r.t4_kills + r.t5_kills)}
                      </td>
                      <td className="px-4 py-2 text-right text-paper">{formatCompact(r.deaths)}</td>
                      <td className="px-4 py-2 text-right text-brassBright">{formatCompact(r.points)}</td>
                      <td className="px-4 py-2 text-right text-steel">{formatCompact(r.required)}</td>
                      <td className={`px-4 py-2 text-right ${r.pass ? "text-drabBright" : "text-flareBright"}`}>
                        {r.pass ? "PASS" : "BELOW MIN"}
                      </td>
                    </tr>
                    {r.linkedFarms?.length > 0 && (
                      <tr className="bg-panel2/50">
                        <td></td>
                        <td colSpan={6} className="px-4 pb-2 pt-0 text-xs text-steelDim">
                          <span className="text-drabBright">+ farms:</span>{" "}
                          {r.linkedFarms
                            .map(
                              (f) =>
                                `${f.name} (${f.id}) — T4 ${formatCompact(f.t4_kills)} / T5 ${formatCompact(
                                  f.t5_kills
                                )} / Deaths ${formatCompact(f.deaths)}, counted at 20%`
                            )
                            .join("  ·  ")}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
