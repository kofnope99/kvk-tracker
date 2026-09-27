"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../../components/NavBar";
import SearchBox from "../../components/SearchBox";
import { supabasePublic } from "../../lib/supabaseClient";

export default function FortPage() {
  const [weeks, setWeeks] = useState([]);
  const [statsByWeek, setStatsByWeek] = useState({}); // weekId -> rows
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: wks } = await supabasePublic.from("fort_weeks").select("*").order("created_at", { ascending: true });
      const list = wks || [];
      setWeeks(list);
      const byWeek = {};
      for (const w of list) {
        const { data: rows } = await supabasePublic.from("fort_stats").select("*").eq("fort_week_id", w.id);
        byWeek[w.id] = rows || [];
      }
      setStatsByWeek(byWeek);
      if (list.length) setSelectedWeekId(list[list.length - 1].id);
      setLoading(false);
    })();
  }, []);

  // Off-season totals, keyed by governor_id — name is taken from that
  // governor's most recent appearance so a rename mid-season doesn't
  // split their total across two rows.
  const offSeasonTotals = useMemo(() => {
    const byId = new Map();
    for (const w of weeks) {
      for (const r of statsByWeek[w.id] || []) {
        const existing = byId.get(r.governor_id) || { id: r.governor_id, name: r.governor_name, total: 0 };
        existing.name = r.governor_name; // keep the latest known name
        existing.total += Number(r.total || 0);
        byId.set(r.governor_id, existing);
      }
    }
    return [...byId.values()];
  }, [weeks, statsByWeek]);

  const kingdomTotal = useMemo(() => offSeasonTotals.reduce((a, r) => a + r.total, 0), [offSeasonTotals]);

  const weeklyTop15 = useMemo(() => {
    const rows = statsByWeek[selectedWeekId] || [];
    return [...rows].sort((a, b) => Number(b.total) - Number(a.total)).slice(0, 15);
  }, [statsByWeek, selectedWeekId]);

  const offSeasonTop10 = useMemo(
    () => [...offSeasonTotals].sort((a, b) => b.total - a.total).slice(0, 10),
    [offSeasonTotals]
  );

  const governorOptions = useMemo(() => offSeasonTotals.map((r) => ({ id: r.id, name: r.name })), [offSeasonTotals]);

  function runSearch(query) {
    if (!query) return;
    const q = query.trim().toLowerCase();
    const match =
      offSeasonTotals.find((r) => r.id === query.trim()) || offSeasonTotals.find((r) => r.name.toLowerCase() === q);
    setSearchResult(match || null);
  }

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="font-display text-4xl tracking-[0.1em] text-brassBright">FORT TRACKER</h1>
          <p className="text-steel text-sm">8-week off-season fort destruction tracking</p>
        </header>

        {loading ? (
          <p className="text-center text-steel font-mono">Loading…</p>
        ) : (
          <>
            <div className="bg-panel border border-hairline rounded-lg p-6 text-center">
              <div className="text-xs tracking-widest text-steelDim uppercase">Kingdom Total — Off Season</div>
              <div className="font-mono text-3xl text-brassBright mt-1">{Math.round(kingdomTotal).toLocaleString()}</div>
            </div>

            <div className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
              <h2 className="font-display text-lg tracking-widest text-brassBright">CHECK YOUR FORT STATS</h2>
              <SearchBox governors={governorOptions} onPick={runSearch} placeholder="Governor ID or name" />
              {searchResult && (
                <div className="bg-panel2 border border-hairline rounded-lg p-4 flex justify-between">
                  <span>
                    {searchResult.name} <span className="text-steelDim">({searchResult.id})</span>
                  </span>
                  <span className="font-mono text-brassBright">{Math.round(searchResult.total).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg tracking-widest text-brassBright">WEEKLY TOP 15</h2>
                  <select
                    className="bg-panel2 border border-hairline rounded px-3 py-1 font-mono text-sm text-paper"
                    value={selectedWeekId}
                    onChange={(e) => setSelectedWeekId(e.target.value)}
                  >
                    {weeks.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <ol className="space-y-2 font-mono text-sm">
                  {weeklyTop15.map((r, i) => (
                    <li key={r.governor_id} className="flex justify-between border-b border-hairline/50 pb-1">
                      <span>
                        <span className="text-steelDim mr-2">{i + 1}.</span>
                        {r.governor_name}
                      </span>
                      <span className="text-brassBright">{Math.round(r.total).toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-panel border border-hairline rounded-lg p-6 space-y-4">
                <h2 className="font-display text-lg tracking-widest text-brassBright">OFF-SEASON TOP 10</h2>
                <ol className="space-y-2 font-mono text-sm">
                  {offSeasonTop10.map((r, i) => (
                    <li key={r.id} className="flex justify-between border-b border-hairline/50 pb-1">
                      <span>
                        <span className="text-steelDim mr-2">{i + 1}.</span>
                        {r.name}
                      </span>
                      <span className="text-brassBright">{Math.round(r.total).toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
