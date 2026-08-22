"use client";
import { useState, useEffect } from "react";
import { supabasePublic } from "../../lib/supabaseClient";
import { Shield } from "lucide-react";

export default function FortPage() {
  const [fortData, setFortData] = useState(null);
  const [fortLoading, setFortLoading] = useState(true);
  const [fortWeeksList, setFortWeeksList] = useState([]);
  const [fortAllStats, setFortAllStats] = useState([]);
  const [fortQuery, setFortQuery] = useState("");
  const [fortSuggestOpen, setFortSuggestOpen] = useState(false);
  const [fortMatches, setFortMatches] = useState(null);
  const [fortResult, setFortResult] = useState(null);
  const [fortError, setFortError] = useState("");

  // Fort tracker: kingdom-wide total, latest week's ranking, and the
  // off-season cumulative top 10.
  useEffect(() => {
    (async () => {
      setFortLoading(true);
      const { data: weeks } = await supabasePublic
        .from("fort_weeks").select("*").order("uploaded_at", { ascending: true });

      if (!weeks || weeks.length === 0) {
        setFortData(null);
        setFortLoading(false);
        return;
      }

      const weekIds = weeks.map((w) => w.id);
      const { data: allStats } = await supabasePublic
        .from("fort_stats").select("*").in("week_id", weekIds);

      const kingdomTotal = (allStats || []).reduce((sum, r) => sum + Number(r.total || 0), 0);

      const latestWeek = weeks[weeks.length - 1];
      const weeklyRanking = (allStats || [])
        .filter((r) => r.week_id === latestWeek.id)
        .sort((a, b) => Number(b.total) - Number(a.total))
        .slice(0, 15);

      const bySeasonTotal = {};
      for (const r of allStats || []) {
        const key = r.governor_id;
        if (!bySeasonTotal[key]) bySeasonTotal[key] = { governor_id: r.governor_id, governor_name: r.governor_name, total: 0 };
        bySeasonTotal[key].total += Number(r.total || 0);
        if (r.governor_name) bySeasonTotal[key].governor_name = r.governor_name;
      }
      const seasonTop10 = Object.values(bySeasonTotal).sort((a, b) => b.total - a.total).slice(0, 10);

      setFortData({ kingdomTotal, latestWeekLabel: latestWeek.label, weeklyRanking, seasonTop10, weeksCount: weeks.length });
      setFortWeeksList(weeks);
      setFortAllStats(allStats || []);
      setFortLoading(false);
    })();
  }, []);

  // Fort search runs entirely against data already loaded on the page
  // (no extra network calls needed) since the whole off-season's data
  // is small enough to filter client-side.
  function fortSuggestionMatches(query) {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || fortAllStats.length === 0) return [];
    const matches = fortAllStats.filter(
      (r) => r.governor_id === query.trim() || (r.governor_name || "").toLowerCase().includes(q)
    );
    return Array.from(new Map(matches.map((r) => [r.governor_id, r])).values()).slice(0, 8);
  }

  function showFortResult(governorId) {
    setFortMatches(null);
    setFortSuggestOpen(false);
    const rows = fortAllStats.filter((r) => r.governor_id === governorId);
    if (rows.length === 0) { setFortError("No fort data found for that governor."); return; }
    const name = rows[0]?.governor_name || governorId;
    const perWeek = fortWeeksList.map((w) => {
      const row = rows.find((r) => r.week_id === w.id);
      return { label: w.label, total: row ? Number(row.total) : null };
    });
    const seasonTotal = rows.reduce((sum, r) => sum + Number(r.total || 0), 0);
    setFortResult({ governorId, name, perWeek, seasonTotal });
  }

  function searchFort() {
    setFortError("");
    setFortResult(null);
    setFortMatches(null);
    setFortSuggestOpen(false);
    const query = fortQuery.trim();
    if (!query) return;
    if (fortAllStats.length === 0) { setFortError("No fort data uploaded yet."); return; }

    let idMatches = fortAllStats.filter((r) => r.governor_id === query);
    let unique = Array.from(new Map(idMatches.map((r) => [r.governor_id, r])).values());
    if (unique.length === 0) {
      const nameMatches = fortAllStats.filter((r) => (r.governor_name || "").toLowerCase().includes(query.toLowerCase()));
      unique = Array.from(new Map(nameMatches.map((r) => [r.governor_id, r])).values());
    }
    if (unique.length === 0) { setFortError("No governor found with that ID or name."); return; }
    if (unique.length > 1) { setFortMatches(unique); return; }
    showFortResult(unique[0].governor_id);
  }

  return (
    <main className="space-y-8">
      <header className="border-b-2 border-brass pb-4 mb-2">
        <p className="font-data text-xs tracking-[0.25em] text-brass uppercase">Kingdom 2194</p>
        <div className="flex items-end justify-between mt-1">
          <h1 className="font-display text-3xl uppercase tracking-wide text-paper">Fort Tracker</h1>
          <a href="/" className="font-data text-xs tracking-wider text-steel hover:text-brassBright uppercase">← Home</a>
        </div>
      </header>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-lg uppercase tracking-wide text-paper flex items-center gap-2">
            <Shield size={16} className="text-brass" /> Fort Tracker
          </h2>
          {fortData && <span className="font-data text-[10px] text-steelDim uppercase">{fortData.weeksCount}/8 weeks this off-season</span>}
        </div>

        {fortLoading ? (
          <p className="text-sm text-steelDim">Loading...</p>
        ) : !fortData ? (
          <p className="text-sm text-steel">No fort data uploaded yet this off-season.</p>
        ) : (
          <>
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 outline-none font-data focus:border-brass"
                    placeholder="Governor ID or name"
                    value={fortQuery}
                    onChange={(e) => { setFortQuery(e.target.value); setFortSuggestOpen(true); }}
                    onFocus={() => setFortSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setFortSuggestOpen(false), 150)}
                    onKeyDown={(e) => e.key === "Enter" && searchFort()}
                  />
                  {fortSuggestOpen && fortSuggestionMatches(fortQuery).length > 0 && (
                    <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-panel2 border border-hairline rounded-sm max-h-56 overflow-y-auto">
                      {fortSuggestionMatches(fortQuery).map((s) => (
                        <li key={s.governor_id}>
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setFortQuery(s.governor_name); showFortResult(s.governor_id); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-panel3 flex justify-between gap-2"
                          >
                            <span className="truncate">{s.governor_name}</span>
                            <span className="font-data text-steelDim shrink-0">{s.governor_id}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button onClick={searchFort} className="bg-brass hover:bg-brassBright text-ink px-4 py-2 rounded-sm font-display uppercase tracking-wide">
                  Search
                </button>
              </div>
            </div>
            {fortError && <p className="text-flareBright text-sm">{fortError}</p>}
            {fortMatches && (
              <ul className="space-y-1">
                {fortMatches.map((m) => (
                  <li key={m.governor_id}>
                    <button
                      onClick={() => showFortResult(m.governor_id)}
                      className="w-full text-left bg-panel2 hover:bg-panel3 border border-hairline rounded-sm px-3 py-2 text-sm"
                    >
                      {m.governor_name} <span className="font-data text-steelDim">({m.governor_id})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fortResult && (
              <div className="bg-panel2 rounded-sm border border-hairline p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-paper">{fortResult.name} <span className="font-data text-steelDim">({fortResult.governorId})</span></p>
                  <div className="text-right">
                    <p className="font-data text-[10px] tracking-widest text-steelDim uppercase">Off-season total</p>
                    <p className="font-data font-tnum text-xl text-brassBright">{fortResult.seasonTotal.toLocaleString()}</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {fortResult.perWeek.map((w) => (
                    <li key={w.label} className="ledger-row text-steel text-sm">
                      <span>{w.label}</span>
                      <span className="leader" />
                      <span className="font-data font-tnum text-paper">{w.total !== null ? w.total.toLocaleString() : "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-panel2 rounded-sm border border-hairline p-4 flex items-center justify-between">
              <p className="font-data text-[10px] tracking-widest text-steelDim uppercase">Kingdom total forts destroyed</p>
              <p className="font-data font-tnum text-3xl text-brassBright">{fortData.kingdomTotal.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="font-data text-[10px] tracking-widest text-brass uppercase mb-2">This week's ranking — {fortData.latestWeekLabel}</p>
                <ol className="text-sm space-y-1.5">
                  {fortData.weeklyRanking.map((g, i) => (
                    <li key={g.id} className="ledger-row text-steel">
                      <span className="font-data text-steelDim w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="truncate">{g.governor_name}</span>
                      <span className="leader" />
                      <span className="font-data font-tnum text-paper">{Number(g.total).toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="font-data text-[10px] tracking-widest text-brass uppercase mb-2">Top 10 — off-season total</p>
                <ol className="text-sm space-y-1.5">
                  {fortData.seasonTop10.map((g, i) => (
                    <li key={g.governor_id} className="ledger-row text-steel">
                      <span className="font-data text-steelDim w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="truncate">{g.governor_name}</span>
                      <span className="leader" />
                      <span className="font-data font-tnum text-paper">{g.total.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </section>

    </main>
  );
}
