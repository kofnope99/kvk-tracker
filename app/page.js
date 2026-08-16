"use client";
import { useState, useEffect } from "react";
import { supabasePublic } from "../lib/supabaseClient";
import { computeDelta, computePoints, findRequirementTier, computeRequiredPoints } from "../lib/points";
import StatsCharts from "./StatsCharts";

export default function Home() {
  const [govId, setGovId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");

  const [allianceTotals, setAllianceTotals] = useState(null);
  const [allianceLoading, setAllianceLoading] = useState(true);

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
    })();
  }, []);

  // Whole-alliance totals across every KvK ever uploaded, for the
  // homepage summary cards. Sums every governor's gains (latest minus
  // that KvK's baseline) across every event.
  useEffect(() => {
    (async () => {
      setAllianceLoading(true);
      const { data: allEvents } = await supabasePublic.from("kvk_events").select("id");
      let totalT4 = 0, totalT5 = 0, totalDeaths = 0;

      for (const ev of allEvents || []) {
        const { data: snaps } = await supabasePublic
          .from("snapshots")
          .select("*")
          .eq("kvk_event_id", ev.id)
          .order("uploaded_at", { ascending: true });
        if (!snaps || snaps.length < 1) continue;

        const baseline = snaps.length > 1 ? (snaps.find((s) => s.is_baseline) || snaps[0]) : null;
        const latest = snaps[snaps.length - 1];
        if (baseline && baseline.id === latest.id) continue;

        const baselineRows = baseline
          ? (await supabasePublic
              .from("governor_stats").select("governor_id,t4_kills,t5_kills,deaths").eq("snapshot_id", baseline.id)
            ).data
          : [];
        const { data: latestRows } = await supabasePublic
          .from("governor_stats").select("governor_id,t4_kills,t5_kills,deaths").eq("snapshot_id", latest.id);

        for (const l of latestRows || []) {
          const b = baselineRows?.find((r) => r.governor_id === l.governor_id);
          const d = computeDelta(b, l);
          totalT4 += d.t4_kills;
          totalT5 += d.t5_kills;
          totalDeaths += d.deaths;
        }
      }

      setAllianceTotals({ totalKills: totalT4 + totalT5, totalT4, totalT5, totalDeaths });
      setAllianceLoading(false);
    })();
  }, []);

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

  async function search() {
    setError("");
    setResult(null);
    if (!govId.trim()) return;
    if (!selectedEventId || !selectedSnapshotId) {
      setError("No stats uploaded yet for that KvK.");
      return;
    }
    setLoading(true);
    try {
      // With only one snapshot uploaded for this KvK, there's nothing to
      // compare it against -- treat it as starting from zero so the
      // numbers shown are that file's totals, not a delta against itself.
      const baseline = snapshots.length > 1 ? (snapshots.find((s) => s.is_baseline) || snapshots[0]) : null;
      const latest = snapshots.find((s) => String(s.id) === selectedSnapshotId);
      const eventName = events.find((e) => String(e.id) === String(selectedEventId))?.name || "";

      if (!latest) {
        setError("No stats uploaded yet for that KvK.");
        return;
      }

      // find approved farm links for this governor
      const { data: links } = await supabasePublic
        .from("account_links")
        .select("*")
        .eq("main_governor_id", govId.trim())
        .eq("status", "approved");

      const allIds = [govId.trim(), ...(links || []).map((l) => l.farm_governor_id)];

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

      // combine main + farms
      let totalDelta = { power: 0, t4_kills: 0, t5_kills: 0, deaths: 0, acclaims: 0, healed_troops: 0, trades: 0 };
      const perAccount = [];
      for (const id of allIds) {
        const b = baselineRows?.find((r) => r.governor_id === id);
        const l = latestRows?.find((r) => r.governor_id === id);
        if (!l) continue;
        const d = computeDelta(b, l);
        perAccount.push({ id, name: l.governor_name, delta: d });
        totalDelta.power += d.power;
        totalDelta.t4_kills += d.t4_kills;
        totalDelta.t5_kills += d.t5_kills;
        totalDelta.deaths += d.deaths;
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
        for (const id of allIds) {
          const b = baselineRows.find((r) => r.governor_id === id);
          const l = rows.find((r) => r.governor_id === id);
          if (!l) continue;
          const delta = computeDelta(b, l);
          d.power += delta.power;
          d.t4_kills += delta.t4_kills;
          d.t5_kills += delta.t5_kills;
          d.deaths += delta.deaths;
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
    } catch (e) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
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
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">KvK Governor Tracker</h1>
        <a href="/admin" className="text-sm text-slate-400 hover:text-slate-200">Admin</a>
      </header>

      <section className="bg-slate-900 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Alliance totals — all KvKs</h2>
        {allianceLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : allianceTotals ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Total Kills" value={allianceTotals.totalKills.toLocaleString()} />
            <Stat label="T4 Kills" value={allianceTotals.totalT4.toLocaleString()} />
            <Stat label="T5 Kills" value={allianceTotals.totalT5.toLocaleString()} />
            <Stat label="Total Deaths" value={allianceTotals.totalDeaths.toLocaleString()} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">No stats uploaded yet.</p>
        )}
      </section>

      <section className="bg-slate-900 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Check your stats</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}{ev.is_active ? " (current)" : ""}</option>
            ))}
          </select>
          <select
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm"
            value={selectedSnapshotId}
            onChange={(e) => setSelectedSnapshotId(e.target.value)}
          >
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>View as of: {s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2 outline-none"
            placeholder="Your Governor ID"
            value={govId}
            onChange={(e) => setGovId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button onClick={search} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium">
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {result && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-400">
              {result.eventName} — comparing "{result.baselineLabel}" to "{result.latestLabel}"
              {!result.isLatestOverall && (
                <span className="text-amber-400"> (viewing a past point, not the newest data)</span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Power" value={result.totalDelta.power.toLocaleString()} />
              <Stat label="T4 Kills" value={result.totalDelta.t4_kills.toLocaleString()} />
              <Stat label="T5 Kills" value={result.totalDelta.t5_kills.toLocaleString()} />
              <Stat label="Deaths" value={result.totalDelta.deaths.toLocaleString()} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Not counted toward points — informational only</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="Acclaims" value={result.totalDelta.acclaims.toLocaleString()} />
                <Stat label="Healed Troops" value={result.totalDelta.healed_troops.toLocaleString()} />
                <Stat label="Trades" value={result.totalDelta.trades.toLocaleString()} />
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
              <div>
                <p className="text-sm text-slate-400">Points earned</p>
                <p className="text-2xl font-bold">{result.points.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Required</p>
                <p className={"text-2xl font-bold " + (result.points >= result.requirement ? "text-emerald-400" : "text-red-400")}>
                  {result.requirement.toLocaleString()}
                </p>
                <p className={"text-xs " + (result.points >= result.requirement ? "text-emerald-400" : "text-red-400")}>
                  {result.points >= result.requirement ? "PASSING" : "BELOW REQUIREMENT"}
                </p>
                {result.tier.min_deaths === 0 && result.tier.min_kills === 0 ? (
                  <p className="text-xs text-slate-500 mt-1">Power below lowest tier — no requirement</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">
                    Tier min: {result.tier.min_deaths.toLocaleString()} deaths / {result.tier.min_kills.toLocaleString()} kills
                  </p>
                )}
              </div>
            </div>
            {result.perAccount.length > 1 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Linked accounts included:</p>
                <ul className="text-sm space-y-1">
                  {result.perAccount.map((a) => (
                    <li key={a.id} className="text-slate-300">{a.name || a.id} ({a.id})</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Progress this KvK</h3>
              <StatsCharts data={result.chartData} />
            </div>
          </div>
        )}
      </section>

      <section className="bg-slate-900 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Link a farm account</h2>
        <p className="text-sm text-slate-400">
          Submit your main Governor ID and your farm's Governor ID. An admin will approve it, then your farm's kills/deaths will count toward your total automatically.
        </p>
        <form onSubmit={submitLink} className="flex flex-col sm:flex-row gap-2">
          <input className="flex-1 rounded-lg bg-slate-800 px-3 py-2" placeholder="Your MAIN Governor ID"
            value={linkMain} onChange={(e) => setLinkMain(e.target.value)} required />
          <input className="flex-1 rounded-lg bg-slate-800 px-3 py-2" placeholder="Your FARM Governor ID"
            value={linkFarm} onChange={(e) => setLinkFarm(e.target.value)} required />
          <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium">Request link</button>
        </form>
        {linkMsg && <p className="text-sm text-slate-300">{linkMsg}</p>}
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
