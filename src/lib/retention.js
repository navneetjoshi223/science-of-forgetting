// ─── Base retention curves ───────────────────────────────────────────────────
// Day 0–7 retention values for the two anchor states.
const NO_REVISION   = [100, 58, 40, 30, 24, 20, 17, 15];
const WITH_REVISION = [100, 92, 87, 83, 80, 78, 76, 74];

// ─── Core model ─────────────────────────────────────────────────────────────
// Linear interpolation between the two anchor curves based on revision
// frequency (0 = never, 7 = daily). Each integer step represents one
// additional revision session per week.
export function computeRetentionData(freq) {
  const t = freq / 7;
  return NO_REVISION.map((base, i) => ({
    day: i,
    retention: Math.round(base + (WITH_REVISION[i] - base) * t),
  }));
}

export function getDay7Retention(freq) {
  return computeRetentionData(freq)[7].retention;
}

// ─── Colour ramp: red(0) → amber(3) → green(7) ──────────────────────────────
export function getLineColor(freq) {
  if (freq <= 3) {
    const t = freq / 3;
    return `rgb(${r(239,232,t)},${r(83,197,t)},${r(80,71,t)})`;
  }
  const t = (freq - 3) / 4;
  return `rgb(${r(232,102,t)},${r(197,187,t)},${r(71,106,t)})`;
}

function r(a, b, t) { return Math.round(a + (b - a) * t); }

// ─── UI copy ─────────────────────────────────────────────────────────────────
export const FREQ_LABELS = [
  'Never',
  'Once a week',
  'Twice a week',
  '3× a week',
  '4× a week',
  '5× a week',
  '6× a week',
  'Daily',
];

export const MESSAGES = [
  {
    headline: "You'll forget almost everything",
    body: 'Without any review, the forgetting curve wins. Less than 20% of what you learned remains after a week.',
  },
  {
    headline: 'Minimal review, significant loss',
    body: 'Once-a-week review slows decay slightly, but most memories still fade before you return to them.',
  },
  {
    headline: 'Some reinforcement helps',
    body: 'Twice-weekly review catches memories before they fully erode — though large gaps still cause significant loss.',
  },
  {
    headline: "You're crossing the halfway mark",
    body: "Three sessions a week keeps you above 50%. You're retaining more than you're losing.",
  },
  {
    headline: "You're outpacing the forgetting curve",
    body: 'Four reviews a week means you revisit material before the curve steepens. Retention climbs steadily.',
  },
  {
    headline: 'Strong retention is taking hold',
    body: 'Near-daily practice is transforming short-term learning into durable long-term memory.',
  },
  {
    headline: 'Your memory is becoming robust',
    body: "Near-daily review flattens the curve dramatically. You're retaining well over two-thirds.",
  },
  {
    headline: 'Daily review changes everything',
    body: 'Reviewing every day keeps retention above 70% all week. The forgetting curve barely registers.',
  },
];
