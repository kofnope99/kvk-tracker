// Core point-math helpers. These operate on individual governor_stats rows
// (one snapshot, one governor). Power is deliberately NOT part of any
// delta here — power is handled separately in lib/aggregate.js because it
// is a "current state" value pinned to the matchmaking sheet, not a stat
// that accumulates over a KvK.

export function computeDelta(baselineRow, latestRow) {
  const b = baselineRow || {};
  const l = latestRow || {};
  const diff = (field) => Math.max(0, Number(l[field] || 0) - Number(b[field] || 0));
  return {
    power: Number(l.power || 0), // raw, unused for totals — see aggregate.js
    t4_kills: diff("t4_kills"),
    t5_kills: diff("t5_kills"),
    deaths: diff("deaths"),
    acclaims: diff("acclaims"),
    healed_troops: diff("healed_troops"),
    trades: diff("trades"),
  };
}

export function computePoints(totals, rules) {
  const r = rules || { t4_weight: 10, t5_weight: 12, death_weight: 60 };
  return (
    Number(totals.t4_kills || 0) * Number(r.t4_weight) +
    Number(totals.t5_kills || 0) * Number(r.t5_weight) +
    Number(totals.deaths || 0) * Number(r.death_weight)
  );
}

// requirements: array of { min_power, max_power, min_deaths, min_kills }
// sorted by min_power ascending. Returns the matching tier, or a synthetic
// zero-requirement tier if power is below the lowest configured bracket.
export function findRequirementTier(power, requirements) {
  const list = requirements || [];
  const sorted = [...list].sort((a, b) => Number(a.min_power) - Number(b.min_power));
  for (const tier of sorted) {
    const min = Number(tier.min_power);
    const max = tier.max_power === null || tier.max_power === undefined ? Infinity : Number(tier.max_power);
    if (power >= min && power <= max) return tier;
  }
  if (sorted.length && power < Number(sorted[0].min_power)) {
    return { min_power: 0, max_power: sorted[0].min_power, min_deaths: 0, min_kills: 0, __belowLowest: true };
  }
  return { min_power: 0, max_power: null, min_deaths: 0, min_kills: 0, __belowLowest: true };
}

// A tier's minimum is expressed as (min_deaths, min_kills) to match the
// alliance's real "Minimum" sheet. min_kills is treated at the T5 weight
// since minimum-kill requirements in this alliance are effectively a
// T5-kill floor.
export function computeRequiredPoints(tier, rules) {
  const r = rules || { t4_weight: 10, t5_weight: 12, death_weight: 60 };
  if (!tier) return 0;
  return Number(tier.min_deaths || 0) * Number(r.death_weight) + Number(tier.min_kills || 0) * Number(r.t5_weight);
}

export function formatCompact(n) {
  const num = Number(n || 0);
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(num));
}
