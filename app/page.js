"use client";
import { useState, useEffect } from "react";
import { supabasePublic } from "../lib/supabaseClient";
import { computeDelta, computePoints, findRequirementTier, computeRequiredPoints } from "../lib/points";
import StatsCharts from "./StatsCharts";
import { Swords, Skull, ScrollText, Shield, Crown } from "lucide-react";
import BarCompareChart from "./BarCompareChart";

// Shared helpers for KvK-vs-KvK comparisons -- fetch a single event's
// baseline/latest snapshot pair, then sum stats from it.
async function getEventBaselineLatest(eventId) {
  const { data: snaps } = await supabasePublic
    .from("snapshots").select("*").eq("kvk_event_id", eventId).order("uploaded_at", { ascending: true });
  if (!snaps || snaps.length === 0) return null;
  const baseline = snaps.length > 1 ? (snaps.find((s) => s.is_baseline) || snaps[0]) : null;
  const latest = snaps[snaps.length - 1];
  return { baseline, latest };
}

async function computeAllianceTotalsForEvent(eventId) {
  const bl = await getEventBaselineLatest(eventId);
  if (!bl || !bl.latest) return { totalT4: 0, totalT5: 0, totalDeaths: 0 };
  const ids = bl.baseline ? [bl.baseline.id, bl.latest.id] : [bl.latest.id];
  const { data: rows } = await supabasePublic.from("governor_stats").select("*").in("snapshot_id", ids);
  const baselineRows = bl.baseline ? (rows || []).filter((r) => r.snapshot_id === bl.baseline.id) : [];
  const latestRows = (rows || []).filter((r) => r.snapshot_id === bl.latest.id);
  let totalT4 = 0, totalT5 = 0, totalDeaths = 0;
  for (const l of latestRows) {
    const b = baselineRows.find((r) => r.governor_id === l.governor_id);
    const d = computeDelta(b, l);
    totalT4 += d.t4_kills; totalT5 += d.t5_kills; totalDeaths += d.deaths;
  }
  return { totalT4, totalT5, totalDeaths };
}

async function computeGovernorTotalsForEvent(eventId, mainGovId) {
  const bl = await getEventBaselineLatest(eventId);
  if (!bl || !bl.latest) return null;
  const { data: links } = await supabasePublic
    .from("account_links").select("*").eq("main_governor_id", mainGovId).eq("status", "approved");
  const allIds = [mainGovId, ...(links || []).map((l) => l.farm_governor_id)];
  const ids = bl.baseline ? [bl.baseline.id, bl.latest.id] : [bl.latest.id];
  const { data: rows } = await supabasePublic.from("governor_stats").select("*").in("snapshot_id", ids);
  const baselineRows = bl.baseline ? (rows || []).filter((r) => r.snapshot_id === bl.baseline.id) : [];
  const latestRows = (rows || []).filter((r) => r.snapshot_id === bl.latest.id);
  let t4 = 0, t5 = 0, deaths = 0;
  let found = false;
  for (const id of allIds) {
    const b = baselineRows.find((r) => r.governor_id === id);
    const l = latestRows.find((r) => r.governor_id === id);
    if (!l) continue;
    found = true;
    const d = computeDelta(b, l);
    const w = id === mainGovId ? 1 : 0.2;
    t4 += d.t4_kills * w; t5 += d.t5_kills * w; deaths += d.deaths * w;
  }
  if (!found) return null;
  const { data: rules } = await supabasePublic.from("point_rules").select("*").eq("kvk_event_id", eventId);
  const points = computePoints({ t4_kills: t4, t5_kills: t5, deaths }, rules);
  return { t4_kills: t4, t5_kills: t5, deaths, points };
}

export default function Home() {
  const [govId, setGovId] = useState("");
  const [resolvedGovId, setResolvedGovId] = useState("");
  const [nameMatches, setNameMatches] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");

  const [allianceTotals, setAllianceTotals] = useState(null);
  const [allianceLoading, setAllianceLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [compareEventA, setCompareEventA] = useState("");
  const [compareEventB, setCompareEventB] = useState("");
  const [allianceCompareData, setAllianceCompareData] = useState(null);

  const [govCompareEventId, setGovCompareEventId] = useState("");
  const [govCompareData, setGovCompareData] = useState(null);
  const [govCompareLoading, setGovCompareLoading] = useState(false);

  const [linkMain, setLinkMain] = useState("");
  const [linkFarm, setLinkFarm] = useState("");
  const [linkMsg, setLinkMsg] = useState("");

  // Load every KvK event (past and present) once, on page load.
  useEffect(() => {
    (async () => {
      const { data } = await supabasePublic
        .from("kvk_events")
        .select("*")
        .order("id", { ascending: false });
      setEvents(data || []);
      const active = data?.find((e) => e.is_active) || data?.[0];
      if (active) setSelectedEventId(String(active.id));
      if (data && data.length >= 2) {
        setCompareEventA(String(data[0].id));
        setCompareEventB(String(data[1].id));
      } else if (data && data.length === 1) {
        setCompareEventA(String(data[0].id));
      }
    })();
  }, []);

  // Alliance-wide totals comparison between any two KvKs.
  useEffect(() => {
    if (!compareEventA || !compareEventB) { setAllianceCompareData(null); return; }
    (async () => {
      const [a, b] = await Promise.all([
        computeAllianceTotalsForEvent(compareEventA),
        computeAllianceTotalsForEvent(compareEventB),
      ]);
      setAllianceCompareData([
        { name: "T4 Kills", A: a.totalT4, B: b.totalT4 },
        { name: "T5 Kills", A: a.totalT5, B: b.totalT5 },
        { name: "Deaths", A: a.totalDeaths, B: b.totalDeaths },
      ]);
    })();
  }, [compareEventA, compareEventB]);

  // Whenever the chosen KvK changes, load its snapshots (Day 1, Day 3, ...)
  // and default the "view as of" picker to the newest one.
  useEffect(() => {
    if (!selectedEventId) return;
    (async () => {
      const { data } = await supabasePublic
        .from("snapshots")
        .select("*")
        .eq("kvk_event_id", selectedEventId)
        .order("uploaded_at", { ascending: true });
      setSnapshots(data || []);
      if (data && data.length) setSelectedSnapshotId(String(data[data.length - 1].id));
      else setSelectedSnapshotId("");
    })();
  }, [selectedEventId]);

  // Builds the top-kills / top-deaths leaderboards for whichever KvK and
  // snapshot is currently selected. Farm accounts aren't listed on their
  // own -- their (20%-weighted) stats are folded into their main account.
  useEffect(() => {
    if (!selectedEventId || snapshots.length === 0 || !selectedSnapshotId) {
      setLeaderboard(null);
      setAllianceTotals(null);
      setAllianceLoading(false);
      return;
    }
    (async () => {
      setLeaderboardLoading(true);
      setAllianceLoading(true);
      const baseline = snapshots.length > 1 ? (snapshots.find((s) => s.is_baseline) || snapshots[0]) : null;
      const latest = snapshots.find((s) => String(s.id) === selectedSnapshotId);
      if (!latest) {
        setLeaderboard(null); setLeaderboardLoading(false);
        setAllianceTotals(null); setAllianceLoading(false);
        return;
      }

      const snapshotIds = baseline ? [baseline.id, latest.id] : [latest.id];
      const { data: rows } = await supabasePublic
        .from("governor_stats").select("*").in("snapshot_id", snapshotIds);
      const baselineRows = baseline ? (rows || []).filter((r) => r.snapshot_id === baseline.id) : [];
      const latestRows = (rows || []).filter((r) => r.snapshot_id === latest.id);

      // Raw alliance-wide totals (every governor row, farms included at
      // full value -- this is "total kills/deaths that happened", not a
      // per-governor attribution, so no 20% weighting here).
      let totalT4 = 0, totalT5 = 0, totalDeaths = 0;
      for (const l of latestRows) {
        const b = baselineRows.find((r) => r.governor_id === l.governor_id);
        const d = computeDelta(b, l);
        totalT4 += d.t4_kills;
        totalT5 += d.t5_kills;
        totalDeaths += d.deaths;
      }
      const eventName = events.find((e) => String(e.id) === String(selectedEventId))?.name;
      setAllianceTotals({ totalKills: totalT4 + totalT5, totalT4, totalT5, totalDeaths, eventName, updatedAt: latest.uploaded_at });
      setAllianceLoading(false);

      const { data: links } = await supabasePublic.from("account_links").select("*").eq("status", "approved");
      const farmIds = new Set((links || []).map((l) => l.farm_governor_id));
      const farmsByMain = {};
      for (const l of links || []) (farmsByMain[l.main_governor_id] ||= []).push(l.farm_governor_id);

      const totals = [];
      for (const l of latestRows) {
        if (farmIds.has(l.governor_id)) continue; // shown under their main instead
        const b = baselineRows.find((r) => r.governor_id === l.governor_id);
        const d = computeDelta(b, l);
        let kills = d.t4_kills + d.t5_kills;
        let deaths = d.deaths;
        for (const farmId of farmsByMain[l.governor_id] || []) {
          const fl = latestRows.find((r) => r.governor_id === farmId);
          if (!fl) continue;
          const fb = baselineRows.find((r) => r.governor_id === farmId);
          const fd = computeDelta(fb, fl);
          kills += (fd.t4_kills + fd.t5_kills) * 0.2;
          deaths += fd.deaths * 0.2;
        }
        totals.push({ id: l.governor_id, name: l.governor_name || l.governor_id, kills, deaths });
      }

      const topKills = [...totals].sort((a, b) => b.kills - a.kills).slice(0, 15);
      const topDeaths = [...totals].sort((a, b) => b.deaths - a.deaths).slice(0, 10);
      setLeaderboard({ topKills, topDeaths });
      setLeaderboardLoading(false);
    })();
  }, [selectedEventId, selectedSnapshotId, snapshots]);

  // Live suggestions as the person types a name or ID -- debounced so
  // it doesn't fire a query on every keystroke.
  useEffect(() => {
    const query = govId.trim();
    if (query.length < 2 || !selectedSnapshotId) { setSuggestions([]); return; }
    const handle = setTimeout(async () => {
      const latest = snapshots.find((s) => String(s.id) === selectedSnapshotId);
      if (!latest) { setSuggestions([]); return; }
      const [byId, byName] = await Promise.all([
        supabasePublic.from("governor_stats").select("governor_id,governor_name")
          .eq("snapshot_id", latest.id).ilike("governor_id", `${query}%`).limit(6),
        supabasePublic.from("governor_stats").select("governor_id,governor_name")
          .eq("snapshot_id", latest.id).ilike("governor_name", `%${query}%`).limit(6),
      ]);
      const merged = [...(byId.data || []), ...(byName.data || [])];
      const unique = Array.from(new Map(merged.map((r) => [r.governor_id, r])).values()).slice(0, 8);
      setSuggestions(unique);
    }, 250);
    return () => clearTimeout(handle);
  }, [govId, selectedSnapshotId, snapshots]);

  async function search() {
    setError("");
    setResult(null);
    setNameMatches(null);
    setSuggestionsOpen(false);
    setGovCompareEventId("");
    setGovCompareData(null);
    const query = govId.trim();
    if (!query) return;
    if (!selectedEventId || !selectedSnapshotId) {
      setError("No stats uploaded yet for that KvK.");
      return;
    }
    setLoading(true);
    try {
      const latest = snapshots.find((s) => String(s.id) === selectedSnapshotId);
      if (!latest) {
        setError("No stats uploaded yet for that KvK.");
        return;
      }

      // Try an exact Governor ID match first; fall back to a name search.
      const { data: idRow } = await supabasePublic
        .from("governor_stats").select("governor_id,governor_name")
        .eq("snapshot_id", latest.id).eq("governor_id", query).maybeSingle();

      let id = idRow?.governor_id;
      if (!id) {
        const { data: matches } = await supabasePublic
          .from("governor_stats").select("governor_id,governor_name")
          .eq("snapshot_id", latest.id).ilike("governor_name", `%${query}%`);
        const unique = Array.from(new Map((matches || []).map((r) => [r.governor_id, r])).values());
        if (unique.length === 0) {
          setError("No governor found with that ID or name.");
          return;
        }
        if (unique.length > 1) {
          setNameMatches(unique);
          return;
        }
        id = unique[0].governor_id;
      }
      await runSearchForId(id);
    } catch (e) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function pickNameMatch(id, displayValue) {
    setNameMatches(null);
    setSuggestions([]);
    setSuggestionsOpen(false);
    if (displayValue) setGovId(displayValue);
    setLoading(true);
    runSearchForId(id).finally(() => setLoading(false));
  }

  async function runSearchForId(id) {
    setResolvedGovId(id);
    const baseline = snapshots.length > 1 ? (snapshots.find((s) => s.is_baseline) || snapshots[0]) : null;
    const latest = snapshots.find((s) => String(s.id) === selectedSnapshotId);
    const eventName = events.find((e) => String(e.id) === String(selectedEventId))?.name || "";
    if (!latest) { setError("No stats uploaded yet for that KvK."); return; }

    // find approved farm links for this governor
    const { data: links } = await supabasePublic
      .from("account_links")
      .select("*")
      .eq("main_governor_id", id)
      .eq("status", "approved");

    const allIds = [id, ...(links || []).map((l) => l.farm_governor_id)];

    // Pull every snapshot's rows for this governor (+ farms) in one go,
    // both to compute the current view and to build the history chart.
    const snapshotIds = snapshots.map((s) => s.id);
    const { data: allRows } = await supabasePublic
      .from("governor_stats")
      .select("*")
      .in("snapshot_id", snapshotIds)
      .in("governor_id", allIds);

    const baselineRows = baseline ? (allRows || []).filter((r) => r.snapshot_id === baseline.id) : [];
    const latestRows = (allRows || []).filter((r) => r.snapshot_id === latest.id);

    if (!latestRows || latestRows.length === 0) {
      setError("Governor ID not found in that snapshot's stats.");
      return;
    }

    const { data: rules } = await supabasePublic
      .from("point_rules")
      .select("*")
      .eq("kvk_event_id", selectedEventId);

    const { data: requirements } = await supabasePublic
      .from("power_requirements")
      .select("*")
      .eq("kvk_event_id", selectedEventId)
      .order("min_power", { ascending: true });

    // combine main + farms -- a linked farm account only counts 20% of
    // its kills and deaths toward the main account (power and the
    // informational stats stay at full value).
    const FARM_WEIGHT = 0.2;
    const mainId = id;
    let totalDelta = { power: 0, t4_kills: 0, t5_kills: 0, deaths: 0, acclaims: 0, healed_troops: 0, trades: 0 };
    const perAccount = [];
    for (const gid of allIds) {
      const b = baselineRows?.find((r) => r.governor_id === gid);
      const l = latestRows?.find((r) => r.governor_id === gid);
      if (!l) continue;
      const d = computeDelta(b, l);
      const w = gid === mainId ? 1 : FARM_WEIGHT;
      perAccount.push({ id: gid, name: l.governor_name, delta: d, weight: w });
      totalDelta.power += d.power;
      totalDelta.t4_kills += d.t4_kills * w;
      totalDelta.t5_kills += d.t5_kills * w;
      totalDelta.deaths += d.deaths * w;
      totalDelta.acclaims += d.acclaims;
      totalDelta.healed_troops += d.healed_troops;
      totalDelta.trades += d.trades;
    }

    const points = computePoints(totalDelta, rules);
    const tier = findRequirementTier(totalDelta.power, requirements);
    const requirement = computeRequiredPoints(tier, rules);

    // Build the "progress over time" series: one point per snapshot
    // up through the one currently being viewed.
    const viewIndex = snapshots.findIndex((s) => String(s.id) === String(latest.id));
    const chartData = snapshots.slice(0, viewIndex + 1).map((s) => {
      const rows = (allRows || []).filter((r) => r.snapshot_id === s.id);
      let d = { power: 0, t4_kills: 0, t5_kills: 0, deaths: 0, acclaims: 0, healed_troops: 0, trades: 0 };
      for (const gid of allIds) {
        const b = baselineRows.find((r) => r.governor_id === gid);
        const l = rows.find((r) => r.governor_id === gid);
        if (!l) continue;
        const delta = computeDelta(b, l);
        const w = gid === mainId ? 1 : FARM_WEIGHT;
        d.power += delta.power;
        d.t4_kills += delta.t4_kills * w;
        d.t5_kills += delta.t5_kills * w;
        d.deaths += delta.deaths * w;
      }
      return { label: s.label, points: computePoints(d, rules), t4_kills: d.t4_kills, t5_kills: d.t5_kills, deaths: d.deaths };
    });

    setResult({
      eventName,
      baselineLabel: baseline ? baseline.label : "zero (only one snapshot uploaded)",
      latestLabel: latest.label,
      isLatestOverall: String(latest.id) === String(snapshots[snapshots.length - 1]?.id),
      perAccount,
      totalDelta,
      points,
      requirement,
      tier,
      chartData,
    });
  }

  async function compareGovernor(eventId) {
    setGovCompareEventId(eventId);
    if (!eventId || !resolvedGovId) { setGovCompareData(null); return; }
    setGovCompareLoading(true);
    const data = await computeGovernorTotalsForEvent(eventId, resolvedGovId);
    setGovCompareData(data);
    setGovCompareLoading(false);
  }

  async function submitLink(e) {
    e.preventDefault();
    setLinkMsg("");
    const res = await fetch("/api/link-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ main_governor_id: linkMain, farm_governor_id: linkFarm }),
    });
    const data = await res.json();
    setLinkMsg(data.ok ? "Request sent — waiting on admin approval." : `Error: ${data.error}`);
    if (data.ok) { setLinkMain(""); setLinkFarm(""); }
  }

  return (
    <main className="space-y-10">
      <header className="dispatch-scan border border-hairline bg-panel rounded-sm px-6 py-8 space-y-5">
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-brass" />
          <p className="font-data text-xs tracking-[0.3em] text-brass uppercase">Kingdom 2194</p>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-paper leading-none">
          KvK Governor Tracker
        </h1>

        <p className="text-sm text-steel max-w-xl">
          Live kill/death tallies, point thresholds, and pass/fail status for every governor — updated the moment new stats are uploaded.
        </p>

        {allianceTotals?.updatedAt && (
          <p className="font-data text-[10px] text-steelDim uppercase tracking-wider">
            Last dispatch: {new Date(allianceTotals.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        )}

        <nav className="flex flex-wrap gap-2 pt-1">
          <span className="flex items-center gap-1.5 font-data text-xs uppercase tracking-wide bg-panel2 border border-brass text-brassBright px-3 py-1.5 rounded-sm">
            <ScrollText size={13} /> Home
          </span>
          <a href="/mge" className="flex items-center gap-1.5 font-data text-xs uppercase tracking-wide bg-panel2 hover:bg-panel3 border border-hairline text-steel hover:text-brassBright px-3 py-1.5 rounded-sm">
            <Swords size={13} /> MGE Application
          </a>
          <a href="/admin" className="flex items-center gap-1.5 font-data text-xs uppercase tracking-wide bg-panel2 hover:bg-panel3 border border-hairline text-steel hover:text-brassBright px-3 py-1.5 rounded-sm">
            <Shield size={13} /> Admin
          </a>
        </nav>
      </header>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-3">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper flex items-center gap-2">
          <Swords size={16} className="text-brass" /> Alliance totals — {allianceTotals?.eventName || "current KvK"}
        </h2>
        {allianceLoading ? (
          <p className="text-sm text-steelDim">Loading...</p>
        ) : allianceTotals ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Total Kills" value={allianceTotals.totalKills.toLocaleString()} />
            <Stat label="T4 Kills" value={allianceTotals.totalT4.toLocaleString()} />
            <Stat label="T5 Kills" value={allianceTotals.totalT5.toLocaleString()} />
            <Stat label="Total Deaths" value={allianceTotals.totalDeaths.toLocaleString()} />
          </div>
        ) : (
          <p className="text-sm text-steelDim">No stats uploaded yet.</p>
        )}
      </section>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            className="rounded-sm bg-panel2 border border-hairline px-3 py-2 text-sm"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}{ev.is_active ? " (current)" : ""}</option>
            ))}
          </select>
          <select
            className="rounded-sm bg-panel2 border border-hairline px-3 py-2 text-sm"
            value={selectedSnapshotId}
            onChange={(e) => setSelectedSnapshotId(e.target.value)}
          >
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>View as of: {s.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-steelDim">This picker controls both the leaderboards below and the governor search further down.</p>
      </section>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">Top governors</h2>
        {leaderboardLoading ? (
          <p className="text-sm text-steelDim">Loading...</p>
        ) : leaderboard && (leaderboard.topKills.length > 0 || leaderboard.topDeaths.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="font-data text-[10px] tracking-widest text-brass uppercase mb-2">Top 15 — Kills</p>
              <ol className="text-sm space-y-1.5">
                {leaderboard.topKills.map((g, i) => (
                  <li key={g.id} className="ledger-row text-steel">
                    <span className="font-data text-steelDim w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{g.name}</span>
                    <span className="leader" />
                    <span className="font-data font-tnum text-paper">{Math.round(g.kills).toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="font-data text-[10px] tracking-widest text-flareBright uppercase mb-2 flex items-center gap-1.5"><Skull size={12} /> Top 10 — Deaths</p>
              <ol className="text-sm space-y-1.5">
                {leaderboard.topDeaths.map((g, i) => (
                  <li key={g.id} className="ledger-row text-steel">
                    <span className="font-data text-steelDim w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate">{g.name}</span>
                    <span className="leader" />
                    <span className="font-data font-tnum text-paper">{Math.round(g.deaths).toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <p className="text-sm text-steelDim">No stats uploaded yet for this KvK.</p>
        )}
      </section>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">Compare KvKs — alliance totals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select className="rounded-sm bg-panel2 border border-hairline px-3 py-2 text-sm" value={compareEventA} onChange={(e) => setCompareEventA(e.target.value)}>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <select className="rounded-sm bg-panel2 border border-hairline px-3 py-2 text-sm" value={compareEventB} onChange={(e) => setCompareEventB(e.target.value)}>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
        <BarCompareChart
          data={allianceCompareData}
          labelA={events.find((e) => String(e.id) === String(compareEventA))?.name || "KvK A"}
          labelB={events.find((e) => String(e.id) === String(compareEventB))?.name || "KvK B"}
        />
      </section>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">Check your stats</h2>

        <div className="flex gap-2 relative">
          <div className="flex-1 relative">
            <input
              className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 outline-none font-data focus:border-brass"
              placeholder="Governor ID or name"
              value={govId}
              onChange={(e) => { setGovId(e.target.value); setSuggestionsOpen(true); }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            {suggestionsOpen && suggestions.length > 0 && (
              <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-panel2 border border-hairline rounded-sm max-h-56 overflow-y-auto">
                {suggestions.map((s) => (
                  <li key={s.governor_id}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickNameMatch(s.governor_id, s.governor_name)}
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
          <button onClick={search} disabled={loading} className="bg-brass hover:bg-brassBright text-ink px-4 py-2 rounded-sm font-display uppercase tracking-wide">
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {error && <p className="text-flareBright text-sm">{error}</p>}

        {nameMatches && (
          <div className="space-y-2">
            <p className="font-data text-[10px] tracking-widest text-brass uppercase">Multiple matches — pick one</p>
            <ul className="space-y-1">
              {nameMatches.map((m) => (
                <li key={m.governor_id}>
                  <button
                    onClick={() => pickNameMatch(m.governor_id, m.governor_name)}
                    className="w-full text-left bg-panel2 hover:bg-panel3 border border-hairline rounded-sm px-3 py-2 text-sm"
                  >
                    {m.governor_name} <span className="font-data text-steelDim">({m.governor_id})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-steel">
              {result.eventName} — comparing "{result.baselineLabel}" to "{result.latestLabel}"
              {!result.isLatestOverall && (
                <span className="text-brassBright"> (viewing a past point, not the newest data)</span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Power" value={result.totalDelta.power.toLocaleString()} />
              <Stat label="T4 Kills" value={result.totalDelta.t4_kills.toLocaleString()} />
              <Stat label="T5 Kills" value={result.totalDelta.t5_kills.toLocaleString()} />
              <Stat label="Deaths" value={result.totalDelta.deaths.toLocaleString()} />
            </div>
            <div>
              <p className="text-xs text-steelDim mb-2">Not counted toward points — informational only</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="Acclaims" value={result.totalDelta.acclaims.toLocaleString()} />
                <Stat label="Healed Troops" value={result.totalDelta.healed_troops.toLocaleString()} />
                <Stat label="Trades" value={result.totalDelta.trades.toLocaleString()} />
              </div>
            </div>
            <div className="flex items-center justify-between bg-panel2 rounded-sm border border-hairline p-4">
              <div>
                <p className="font-data text-[10px] tracking-widest text-steelDim uppercase">Points earned</p>
                <p className="font-data font-tnum text-2xl text-paper">{result.points.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-data text-[10px] tracking-widest text-steelDim uppercase">Required</p>
                <p className={"font-data text-2xl font-tnum font-semibold " + (result.points >= result.requirement ? "text-drabBright" : "text-flareBright")}>
                  {result.requirement.toLocaleString()}
                </p>
                <p className={"stamp font-data text-[10px] mt-2 " + (result.points >= result.requirement ? "text-drabBright" : "text-flareBright")}>
                  {result.points >= result.requirement ? "PASS" : "BELOW MIN"}
                </p>
                {result.tier.min_deaths === 0 && result.tier.min_kills === 0 ? (
                  <p className="text-xs text-steelDim mt-1">Power below lowest tier — no requirement</p>
                ) : (
                  <p className="text-xs text-steelDim mt-1">
                    Tier min: {result.tier.min_deaths.toLocaleString()} deaths / {result.tier.min_kills.toLocaleString()} kills
                  </p>
                )}
              </div>
            </div>
            {result.perAccount.length > 1 && (
              <div>
                <p className="text-sm text-steel mb-2">Linked accounts included:</p>
                <ul className="text-sm space-y-1">
                  {result.perAccount.map((a) => (
                    <li key={a.id} className="text-steel">
                      {a.name || a.id} ({a.id}){a.weight < 1 ? ` — farm, counted at ${Math.round(a.weight * 100)}%` : " — main"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-steel mb-3">Progress this KvK</h3>
              <StatsCharts data={result.chartData} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-steel mb-3">Compare against another KvK</h3>
              <select
                className="w-full rounded-sm bg-panel2 border border-hairline px-3 py-2 text-sm mb-3"
                value={govCompareEventId}
                onChange={(e) => compareGovernor(e.target.value)}
              >
                <option value="">Pick a KvK to compare {resolvedGovId} against...</option>
                {events.filter((ev) => String(ev.id) !== String(selectedEventId)).map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
              {govCompareLoading ? (
                <p className="text-sm text-steelDim">Loading...</p>
              ) : govCompareEventId && govCompareData ? (
                <BarCompareChart
                  data={[
                    { name: "T4 Kills", A: result.totalDelta.t4_kills, B: govCompareData.t4_kills },
                    { name: "T5 Kills", A: result.totalDelta.t5_kills, B: govCompareData.t5_kills },
                    { name: "Deaths", A: result.totalDelta.deaths, B: govCompareData.deaths },
                    { name: "Points", A: result.points, B: govCompareData.points },
                  ]}
                  labelA={result.eventName}
                  labelB={events.find((e) => String(e.id) === String(govCompareEventId))?.name}
                />
              ) : govCompareEventId ? (
                <p className="text-sm text-steelDim">No stats found for {resolvedGovId} in that KvK.</p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="bg-panel rounded-sm p-6 border border-hairline field-card space-y-4">
        <h2 className="font-display text-lg uppercase tracking-wide text-paper">Link a farm account</h2>
        <p className="text-sm text-steel">
          Submit your main Governor ID and your farm's Governor ID. An admin will approve it, then your farm's kills and deaths will count toward your total automatically — at 20% weight (power and other stats aren't affected).
        </p>
        <form onSubmit={submitLink} className="flex flex-col sm:flex-row gap-2">
          <input className="flex-1 rounded-sm bg-panel2 border border-hairline px-3 py-2" placeholder="Your MAIN Governor ID"
            value={linkMain} onChange={(e) => setLinkMain(e.target.value)} required />
          <input className="flex-1 rounded-sm bg-panel2 border border-hairline px-3 py-2" placeholder="Your FARM Governor ID"
            value={linkFarm} onChange={(e) => setLinkFarm(e.target.value)} required />
          <button className="bg-panel2 hover:bg-panel3 border border-hairline px-4 py-2 rounded-sm font-display uppercase tracking-wide text-sm">Request link</button>
        </form>
        {linkMsg && <p className="text-sm text-steel">{linkMsg}</p>}
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-panel2 rounded-sm p-3 border border-hairline">
      <p className="font-data text-[10px] tracking-widest text-steelDim uppercase">{label}</p>
      <p className="font-data font-tnum text-lg text-paper">{value}</p>
    </div>
  );
}
