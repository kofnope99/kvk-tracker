"use client";
import { useState, useEffect } from "react";
import { supabasePublic } from "../../lib/supabaseClient";
import { computeDelta, computePoints, findRequirementTier, computeRequiredPoints } from "../../lib/points";
import { Crown } from "lucide-react";

export default function RankingsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabasePublic.from("kvk_events").select("*").order("id", { ascending: false });
      setEvents(data || []);
      const active = data?.find((e) => e.is_active) || data?.[0];
      if (active) setSelectedEventId(String(active.id));
    })();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    (async () => {
      const { data } = await supabasePublic
        .from("snapshots").select("*").eq("kvk_event_id", selectedEventId).order("uploaded_at", { ascending: true });
      setSnapshots(data || []);
      if (data && data.length) setSelectedSnapshotId(String(data[data.length - 1].id));
      else setSelectedSnapshotId("");
    })();
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId || snapshots.length === 0 || !selectedSnapshotId) { setRankings(null); return; }
    (async () => {
      setLoading(true);
      const baseline = snapshots.length > 1 ? (snapshots.find((s) => s.is_baseline) || snapshots[0]) : null;
      const latest = snapshots.find((s) => String(s.id) === selectedSnapshotId);
      if (!latest) { setRankings(null); setLoading(false); return; }

      const snapshotIds = baseline ? [baseline.id, latest.id] : [latest.id];
      const { data: rows } = await supabasePublic.from("governor_stats").select("*").in("snapshot_id", snapshotIds);
      const baselineRows = baseline ? (rows || []).filter((r) => r.snapshot_id === baseline.id) : [];
      const latestRows = (rows || []).filter((r) => r.snapshot_id === latest.id);

      const { data: links } = await supabasePublic.from("account_links").select("*").eq("status", "approved");
      const farmIds = new Set((links || []).map((l) => l.farm_governor_id));
      const farmsByMain = {};
      for (const l of links || []) (farmsByMain[l.main_governor_id] ||= []).push(l.farm_governor_id);

      const { data: rules } = await supabasePublic.from("point_rules").select("*").eq("kvk_event_id", selectedEventId);
      const { data: requirements } = await supabasePublic
        .from("power_requirements").select("*").eq("kvk_event_id", selectedEventId).order("min_power");

      const entries = [];
      for (const l of latestRows) {
        if (farmIds.has(l.governor_id)) continue; // shown under their main instead
        const b = baselineRows.find((r) => r.governor_id === l.governor_id);
        const d = computeDelta(b, l);
        let t4 = d.t4_kills, t5 = d.t5_kills, deaths = d.deaths;
        const power = d.power;
        for (const farmId of farmsByMain[l.governor_id] || []) {
          const fl = latestRows.find((r) => r.governor_id === farmId);
          if (!fl) continue;
          const fb = baselineRows.find((r) => r.governor_id === farmId);
          const fd = computeDelta(fb, fl);
          t4 += fd.t4_kills * 0.2;
          t5 += fd.t5_kills * 0.2;
          deaths += fd.deaths * 0.2;
        }
        const points = computePoints({ t4_kills: t4, t5_kills: t5, deaths }, rules);
        const tier = findRequirementTier(power, requirements);
        const required = computeRequiredPoints(tier, rules);
        entries.push({ id: l.governor_id, name: l.governor_name || l.governor_id, power, points, required, passing: points >= required });
      }

      const sorted = entries.sort((a, b) => b.points - a.points).slice(0, 300);
      setRankings(sorted);
      setLoading(false);
    })();
  }, [selectedEventId, selectedSnapshotId, snapshots]);

  return (
    <main className="space-y-8">
      <header className="border-b-2 border-brass pb-4 mb-2">
        <p className="font-data text-xs tracking-[0.25em] text-brass uppercase">Kingdom 2194</p>
        <div className="flex items-end justify-between mt-1">
          <h1 className="font-display text-3xl uppercase tracking-wide text-paper">Contribution Rankings</h1>
          <a href="/" className="font-data text-xs tracking-wider text-steel hover:text-brassBright uppercase">← Home</a>
        </div>
      </header>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select className="rounded-sm bg-panel2 border border-hairline px-3 py-2 text-sm" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}{ev.is_active ? " (current)" : ""}</option>)}
          </select>
          <select className="rounded-sm bg-panel2 border border-hairline px-3 py-2 text-sm" value={selectedSnapshotId} onChange={(e) => setSelectedSnapshotId(e.target.value)}>
            {snapshots.map((s) => <option key={s.id} value={s.id}>View as of: {s.label}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-steelDim">Loading...</p>
        ) : !rankings || rankings.length === 0 ? (
          <p className="text-sm text-steel">No stats uploaded yet for this KvK.</p>
        ) : (
          <div>
            <p className="font-data text-[10px] tracking-widest text-brass uppercase mb-2 flex items-center gap-1.5">
              <Crown size={12} /> Top {rankings.length} — Contribution Points
            </p>
            <ol className="text-sm divide-y divide-hairline">
              {rankings.map((g, i) => (
                <li key={g.id} className="flex items-center gap-3 py-1.5">
                  <span className="font-data text-steelDim w-9 shrink-0">{String(i + 1).padStart(3, "0")}</span>
                  <span className="flex-1 truncate text-steel">{g.name} <span className="font-data text-steelDim">({g.id})</span></span>
                  <span className="font-data font-tnum text-paper w-28 text-right">{Math.round(g.points).toLocaleString()}</span>
                  <span className={"font-data text-[10px] uppercase w-20 text-right " + (g.passing ? "text-drabBright" : "text-flareBright")}>
                    {g.passing ? "Pass" : "Below"}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </main>
  );
}
