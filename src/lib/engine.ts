import type {
  Criterion,
  Decision,
  Option,
  Overrides,
  RiskItem,
  RiskLevel,
} from '../types';

/* ------------------------------ utilities ------------------------------ */

export const uid = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

export const nowIso = (): string => new Date().toISOString();

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export const fmtScore = (n: number, d = 1): string => n.toFixed(d);

/** Color an adjusted score 0..100 on a coral → amber → teal scale. */
export function scoreColor(v: number): string {
  if (v >= 66) return 'var(--teal)';
  if (v >= 48) return 'var(--amber)';
  return 'var(--coral)';
}

export const OPTION_PALETTE = [
  '#0e8a68',
  '#c07b21',
  '#4a7fae',
  '#a85673',
  '#7c8a45',
  '#6f7fae',
  '#b06a3b',
];

export const nextOptionColor = (d: Decision): string =>
  OPTION_PALETTE[d.options.length % OPTION_PALETTE.length];

/* --------------------------- scoring engine ---------------------------- */

/** Raw weights normalized so they sum to 1. */
export function normalizedWeights(
  criteria: Criterion[],
  weightOverrides?: Record<string, number>,
): Record<string, number> {
  const raw = criteria.map((c) =>
    Math.max(0, weightOverrides?.[c.id] ?? c.weight),
  );
  const total = raw.reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  criteria.forEach((c, i) => {
    out[c.id] = total > 0 ? raw[i] / total : 1 / criteria.length;
  });
  return out;
}

const scoreOf = (
  d: Decision,
  option: Option,
  criterionId: string,
  scoreOverrides?: Record<string, Record<string, number>>,
): number => scoreOverrides?.[option.id]?.[criterionId] ?? option.scores[criterionId] ?? 0;

/** Weighted raw score, 0..100. */
export function rawScore(
  d: Decision,
  option: Option,
  ov?: Overrides,
): number {
  const w = normalizedWeights(d.criteria, ov?.weights);
  let sum = 0;
  for (const c of d.criteria) {
    sum += (w[c.id] ?? 0) * scoreOf(d, option, c.id, ov?.scores);
  }
  return (sum / 10) * 100;
}

/** Risk penalty 0..~22 derived from probability × impact of attached risks. */
export function riskPenalty(d: Decision, option: Option, ov?: Overrides): number {
  const mult = ov?.riskMultiplier ?? 1;
  const attached = d.risks.filter((r) => r.optionId === option.id);
  const load = attached.reduce((a, r) => a + r.probability * r.impact, 0);
  return clamp((load / 25) * 9 * mult, 0, 22);
}

export interface Contribution {
  criterion: Criterion;
  pts: number; // weighted contribution in final points
  score: number; // 0..10
}

export interface ModelRow {
  option: Option;
  raw: number;
  penalty: number;
  adjusted: number;
  rank: number;
  contributions: Contribution[];
  strengths: Contribution[];
  weaknesses: Contribution[];
}

export interface ModelResult {
  rows: ModelRow[];
  winner: ModelRow | null;
  runnerUp: ModelRow | null;
  margin: number;
  confidence: number;
  riskLevel: RiskLevel;
  topDriver: Criterion | null;
  insights: string[];
}

export function computeModel(d: Decision, ov?: Overrides): ModelResult {
  const w = normalizedWeights(d.criteria, ov?.weights);
  const live = d.options.filter((o) => !o.eliminated);

  const rows: ModelRow[] = live.map((option) => {
    const contributions: Contribution[] = d.criteria
      .map((c) => {
        const score = scoreOf(d, option, c.id, ov?.scores);
        return { criterion: c, score, pts: (w[c.id] ?? 0) * score * 10 };
      })
      .sort((a, b) => b.pts - a.pts);
    const raw = rawScore(d, option, ov);
    const penalty = riskPenalty(d, option, ov);
    return {
      option,
      raw,
      penalty,
      adjusted: raw - penalty,
      rank: 0,
      contributions,
      strengths: contributions.slice(0, 2),
      weaknesses: [...contributions].sort((a, b) => a.score - b.score).slice(0, 2),
    };
  });

  rows.sort((a, b) => b.adjusted - a.adjusted);
  rows.forEach((r, i) => (r.rank = i + 1));

  const winner = rows[0] ?? null;
  const runnerUp = rows[1] ?? null;
  const margin = winner && runnerUp ? winner.adjusted - runnerUp.adjusted : 0;

  // ---- confidence composition ----
  const highRel = d.evidence.filter((e) => e.reliability === 'high').length;
  const evidenceFactor = clamp(d.evidence.length * 9 + highRel * 7, 0, 100);
  const marginFactor = clamp(margin * 5, 0, 100);
  const confidence = Math.round(
    clamp(d.baseConfidence * 0.52 + evidenceFactor * 0.28 + marginFactor * 0.2, 3, 97),
  );

  const avgPenalty = rows.length
    ? rows.reduce((a, r) => a + r.penalty, 0) / rows.length
    : 0;
  const riskLevel: RiskLevel = avgPenalty < 4.5 ? 'low' : avgPenalty < 9 ? 'medium' : 'high';

  const topDriver =
    d.criteria.length > 0
      ? [...d.criteria].sort((a, b) => (w[b.id] ?? 0) - (w[a.id] ?? 0))[0]
      : null;

  const insights: string[] = [];
  if (winner && runnerUp) {
    insights.push(
      `${winner.option.name} leads ${runnerUp.option.name} by ${fmtScore(margin)} pts${
        topDriver ? `, driven mostly by ${topDriver.name}` : ''
      }.`,
    );
    if (margin < 4) {
      insights.push(
        `The margin is thin (${fmtScore(margin)} pts) — one weight change could flip the outcome. Try What-If mode.`,
      );
    }
  } else if (winner) {
    insights.push(`${winner.option.name} is the only live option right now.`);
  }
  if (topDriver) {
    insights.push(
      `${topDriver.name} carries ${Math.round((w[topDriver.id] ?? 0) * 100)}% of total weight — the model is most sensitive to it.`,
    );
  }
  const worstRisk = [...d.risks].sort(
    (a, b) => b.probability * b.impact - a.probability * a.impact,
  )[0];
  if (worstRisk && worstRisk.probability * worstRisk.impact >= 9) {
    const linked = d.options.find((o) => o.id === worstRisk.optionId);
    insights.push(
      `${worstRisk.name} is the largest open risk (${worstRisk.probability}×${worstRisk.impact})${
        linked ? ` against ${linked.name}` : ''
      }.`,
    );
  }
  if (winner && winner.weaknesses[0]) {
    insights.push(
      `${winner.option.name}'s weakest point is ${winner.weaknesses[0].criterion.name} at ${
        winner.weaknesses[0].score
      }/10.`,
    );
  }
  const contra = d.evidence.filter((e) => e.stance === 'contradicting').length;
  const supp = d.evidence.filter((e) => e.stance === 'supporting').length;
  if (d.evidence.length > 0) {
    insights.push(
      `Evidence balance: ${supp} supporting vs ${contra} contradicting — ${
        contra === 0 ? 'no counter-signals yet, worth hunting for one.' : 'counter-signals are on the table.'
      }`,
    );
  }

  return { rows, winner, runnerUp, margin, confidence, riskLevel, topDriver, insights };
}

/* --------------------------- what-if diffing --------------------------- */

export function describeDiff(base: ModelResult, next: ModelResult): string[] {
  const msgs: string[] = [];
  const baseById = new Map(base.rows.map((r) => [r.option.id, r]));

  let mover: { name: string; delta: number } | null = null;
  for (const row of next.rows) {
    const b = baseById.get(row.option.id);
    if (!b) continue;
    const delta = row.adjusted - b.adjusted;
    if (Math.abs(delta) >= 0.8) {
      msgs.push(
        `${row.option.name} ${delta > 0 ? 'gains' : 'loses'} ${fmtScore(Math.abs(delta))} pts → ${fmtScore(row.adjusted)}.`,
      );
      if (!mover || Math.abs(delta) > Math.abs(mover.delta)) {
        mover = { name: row.option.name, delta };
      }
    }
  }
  if (base.winner && next.winner && base.winner.option.id !== next.winner.option.id) {
    msgs.unshift(
      `Recommendation flips: ${base.winner.option.name} → ${next.winner.option.name}.`,
    );
  }
  if (mover && msgs.length <= 1) {
    msgs.push(
      `This change most affects ${mover.name} (${mover.delta > 0 ? '+' : '−'}${fmtScore(
        Math.abs(mover.delta),
      )} pts).`,
    );
  }
  const marginDelta = next.margin - base.margin;
  if (Math.abs(marginDelta) >= 1 && next.winner) {
    msgs.push(
      `Lead ${marginDelta > 0 ? 'widens' : 'narrows'} to ${fmtScore(next.margin)} pts — the call gets ${
        marginDelta > 0 ? 'clearer' : 'tighter'
      }.`,
    );
  }
  if (msgs.length === 0) msgs.push('No meaningful movement yet — push a slider harder.');
  return msgs.slice(0, 5);
}

/* ------------------------------ risk utils ----------------------------- */

export const riskLoad = (r: RiskItem): number => r.probability * r.impact;

export function decisionRiskScore(d: Decision): number {
  if (d.risks.length === 0) return 0;
  return d.risks.reduce((a, r) => a + riskLoad(r), 0) / d.risks.length;
}
