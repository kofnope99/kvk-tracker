// Shared math: turns raw stat deltas into points, and checks pass/fail
// against the power-based minimum requirement table.
//
// This mirrors the alliance's own spreadsheet formulas:
//   Total Contribution = Deaths*deathWeight + T4kills*t4Weight + T5kills*t5Weight
//   Min. Contribution   = requiredKills*t5Weight + requiredDeaths*deathWeight
// (the spreadsheet converts a tier's minimum kill/death counts into an
// equivalent point value using the T5-kill and Death weights)

export function computeDelta(baseline, latest) {
  const b = baseline || { power: 0, t4_kills: 0, t5_kills: 0, deaths: 0, acclaims: 0, healed_troops: 0, trades: 0 };
  const l = latest || { power: 0, t4_kills: 0, t5_kills: 0, deaths: 0, acclaims: 0, healed_troops: 0, trades: 0 };
  return {
    power: l.power || 0, // power shown as current, not a delta
    t4_kills: Math.max(0, (l.t4_kills || 0) - (b.t4_kills || 0)),
    t5_kills: Math.max(0, (l.t5_kills || 0) - (b.t5_kills || 0)),
    deaths: Math.max(0, (l.deaths || 0) - (b.deaths || 0)),
    acclaims: Math.max(0, (l.acclaims || 0) - (b.acclaims || 0)),
    healed_troops: Math.max(0, (l.healed_troops || 0) - (b.healed_troops || 0)),
    trades: l.trades || 0, // shown as current value, not a delta
  };
}

function weights(rules) {
  const ruleMap = {};
  for (const r of rules || []) ruleMap[r.stat_name] = Number(r.points_per_unit) || 0;
  return {
    t4: ruleMap.t4_kills || 0,
    t5: ruleMap.t5_kills || 0,
    death: ruleMap.deaths || 0,
  };
}

export function computePoints(delta, rules) {
  const w = weights(rules);
  return delta.t4_kills * w.t4 + delta.t5_kills * w.t5 + delta.deaths * w.death;
}

export function findRequirementTier(power, requirements) {
  for (const r of requirements || []) {
    if (power >= r.min_power && (r.max_power == null || power <= r.max_power)) {
      return r;
    }
  }
  // Power is below every configured bracket (or no tiers exist yet) —
  // treat that as no requirement rather than leaving it undefined.
  return { min_power: 0, max_power: null, min_deaths: 0, min_kills: 0 };
}

// Converts a tier's (min_kills, min_deaths) into an equivalent point
// value, using the same weights as the actual contribution score.
export function computeRequiredPoints(tier, rules) {
  if (!tier) return null;
  const w = weights(rules);
  return tier.min_kills * w.t5 + tier.min_deaths * w.death;
}
