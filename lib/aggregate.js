import { computeDelta, computePoints, findRequirementTier, computeRequiredPoints } from "./points";

const FARM_WEIGHT = 0.2;

/**
 * Builds one row per MAIN governor for a given KvK + snapshot selection.
 * This is the single source of truth for "what does this governor's stat
 * line look like right now" — used by the homepage search, the Top 15 /
 * Top 10 leaderboards, the Rankings page, and the Kingsland Reminder, so
 * they can never disagree with each other again.
 *
 * Everything is keyed by governor_id, never governor_name, so an in-game
 * name change never drops or duplicates a governor. The displayed name
 * and Power are both pinned to the baseline (matchmaking) snapshot for
 * this KvK, falling back to the latest scan only when there is no
 * baseline entry for that governor (e.g. they joined after matchmaking).
 *
 * @param {Array|null} baselineRows  governor_stats rows for the baseline snapshot
 * @param {Array} latestRows         governor_stats rows for the selected snapshot
 * @param {Array} links              approved account_links rows: [{main_governor_id, farm_governor_id}]
 * @param {Object} rules             point_rules row: {t4_weight, t5_weight, death_weight}
 * @param {Array} requirements       power_requirements rows
 */
export function aggregateGovernors(baselineRows, latestRows, links, rules, requirements) {
  baselineRows = baselineRows || [];
  latestRows = latestRows || [];
  links = links || [];

  const baselineById = new Map(baselineRows.map((r) => [r.governor_id, r]));
  const latestById = new Map(latestRows.map((r) => [r.governor_id, r]));

  const farmToMain = new Map(links.map((l) => [l.farm_governor_id, l.main_governor_id]));
  const mainToFarms = new Map();
  for (const l of links) {
    const arr = mainToFarms.get(l.main_governor_id) || [];
    arr.push(l.farm_governor_id);
    mainToFarms.set(l.main_governor_id, arr);
  }

  const allIds = new Set([...latestById.keys(), ...baselineById.keys()]);
  const mainIds = [...allIds].filter((id) => !farmToMain.has(id));

  const rows = [];
  for (const mainId of mainIds) {
    const l = latestById.get(mainId);
    if (!l) continue; // no data at all for this governor in the selected snapshot

    const b = baselineById.get(mainId) || null;

    const name = (b && b.governor_name) || l.governor_name;
    const power = b && b.power ? Number(b.power) : Number(l.power || 0);

    const total = { power, t4_kills: 0, t5_kills: 0, deaths: 0, acclaims: 0, healed_troops: 0, trades: 0 };

    // Per-account breakdown — each account's own (unweighted) gains, plus
    // what it actually contributed to the main's total after the 20% farm
    // weight. This is what lets the UI show main + farm stats together on
    // one screen instead of only the merged total.
    const accounts = [];

    const accountIds = [mainId, ...(mainToFarms.get(mainId) || [])];
    for (const gid of accountIds) {
      const gl = latestById.get(gid);
      if (!gl) continue;
      const gb = baselineById.get(gid) || null;
      const d = computeDelta(gb, gl);
      const isMain = gid === mainId;
      const w = isMain ? 1 : FARM_WEIGHT;
      total.t4_kills += d.t4_kills * w;
      total.t5_kills += d.t5_kills * w;
      total.deaths += d.deaths * w;
      if (isMain) {
        total.acclaims += d.acclaims;
        total.healed_troops += d.healed_troops;
        total.trades += d.trades;
      }
      accounts.push({
        id: gid,
        name: (baselineById.get(gid) && baselineById.get(gid).governor_name) || gl.governor_name,
        role: isMain ? "main" : "farm",
        weight: w,
        t4_kills: d.t4_kills,
        t5_kills: d.t5_kills,
        deaths: d.deaths,
        contributed_t4_kills: d.t4_kills * w,
        contributed_t5_kills: d.t5_kills * w,
        contributed_deaths: d.deaths * w,
      });
    }

    const points = computePoints(total, rules);
    const tier = findRequirementTier(total.power, requirements);
    const required = computeRequiredPoints(tier, rules);

    rows.push({
      id: mainId,
      name,
      accounts,
      linkedFarms: accounts.filter((a) => a.role === "farm"),
      power: total.power,
      t4_kills: total.t4_kills,
      t5_kills: total.t5_kills,
      deaths: total.deaths,
      acclaims: total.acclaims,
      healed_troops: total.healed_troops,
      trades: total.trades,
      points,
      required,
      pass: points >= required,
      tier,
    });
  }

  return rows;
}
