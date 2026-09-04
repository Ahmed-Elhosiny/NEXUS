import { useEffect, useRef, useState } from 'react';
import type { Criterion, RiskItem } from '../types';
import { cn } from '../lib/engine';

/* ------------------------- animation helpers -------------------------- */

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smoothly tween a flat array of numbers toward `target`. */
export function useTweenArray(target: number[], ms = 650): number[] {
  const [vals, setVals] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    if (prefersReduced()) {
      setVals(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const to = target;
    if (from.length !== to.length) {
      setVals(to);
      fromRef.current = to;
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = easeOut(t);
      const cur = to.map((v, i) => (from[i] ?? v) + (v - (from[i] ?? v)) * e);
      setVals(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(target)]);

  return vals;
}

export function useTweenNumber(target: number, ms = 650): number {
  const arr = useTweenArray([target], ms);
  return arr[0] ?? target;
}

/* ------------------------------ Radar --------------------------------- */

export interface RadarSeries {
  name: string;
  color: string;
  values: number[]; // 0..10 per axis
}

export function Radar({
  axes,
  series,
  size = 300,
}: {
  axes: string[];
  series: RadarSeries[];
  size?: number;
}) {
  const flat = series.flatMap((s) => s.values);
  const anim = useTweenArray(flat);
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 44;
  const n = Math.max(axes.length, 3);

  const pt = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  const ring = (f: number) =>
    axes.map((_, i) => pt(i, R * f).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" role="img" aria-label="Criteria radar chart">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="var(--line)" strokeWidth={1} />
      ))}
      {axes.map((label, i) => {
        const [x, y] = pt(i, R);
        const [lx, ly] = pt(i, R + 20);
        return (
          <g key={label + i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--muted)"
              fontSize={10.5}
              fontFamily="IBM Plex Mono, monospace"
            >
              {label.length > 11 ? label.slice(0, 10) + '…' : label}
            </text>
          </g>
        );
      })}
      {series.map((s, si) => {
        const pts = axes
          .map((_, i) => {
            const v = anim[si * axes.length + i] ?? 0;
            return pt(i, (v / 10) * R).join(',');
          })
          .join(' ');
        return (
          <g key={s.name}>
            <polygon points={pts} fill={s.color} fillOpacity={0.12} stroke={s.color} strokeWidth={1.8} strokeLinejoin="round" />
            {axes.map((_, i) => {
              const v = anim[si * axes.length + i] ?? 0;
              const [x, y] = pt(i, (v / 10) * R);
              return <circle key={i} cx={x} cy={y} r={2.6} fill={s.color} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------------------- Rank bars ------------------------------- */

export function RankBars({
  rows,
  unit = 'pts',
  showDelta,
}: {
  rows: { id: string; label: string; color: string; value: number; delta?: number }[];
  unit?: string;
  showDelta?: boolean;
}) {
  const max = Math.max(100, ...rows.map((r) => r.value)) * 1.02;
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
              <span className="font-data text-[11px] text-[var(--faint)]">#{i + 1}</span>
              <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ background: r.color }} />
              <span className="truncate">{r.label}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-1.5">
              {showDelta && r.delta !== undefined && Math.abs(r.delta) >= 0.1 && (
                <span
                  className={cn(
                    'font-data text-[11px] font-medium',
                    r.delta > 0 ? 'text-[var(--teal)]' : 'text-[var(--coral)]',
                  )}
                >
                  {r.delta > 0 ? '▲' : '▼'} {Math.abs(r.delta).toFixed(1)}
                </span>
              )}
              <span className="font-data text-[13px] font-semibold tabular-nums">
                {r.value.toFixed(1)}
              </span>
              <span className="font-data text-[10.5px] text-[var(--faint)]">{unit}</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--sunken)]">
            <div
              className="bar-anim h-full rounded-full"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${r.color}cc, ${r.color})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- Risk matrix ----------------------------- */

export function RiskMatrix({
  risks,
  colorFor,
  compact,
}: {
  risks: RiskItem[];
  colorFor?: (optionId?: string) => string;
  compact?: boolean;
}) {
  const H = compact ? 210 : 260;
  return (
    <div className="flex gap-2">
      <div
        className="flex flex-col justify-between py-1 font-data text-[9.5px] text-[var(--faint)]"
        aria-hidden="true"
      >
        <span className="rotate-180 [writing-mode:vertical-lr]">probability →</span>
      </div>
      <div className="flex-1">
        <div
          className="relative grid grid-cols-5 grid-rows-5 gap-px overflow-hidden rounded-xl border border-[var(--line)]"
          style={{ height: H }}
        >
          {Array.from({ length: 25 }).map((_, i) => {
            const col = i % 5; // impact 1..5
            const row = Math.floor(i / 5); // prob 5..1
            const load = (5 - row) * (col + 1);
            const bg =
              load >= 15
                ? 'color-mix(in srgb, var(--coral) 16%, var(--sunken))'
                : load >= 8
                  ? 'color-mix(in srgb, var(--amber) 10%, var(--sunken))'
                  : 'var(--sunken)';
            return <div key={i} style={{ background: bg, opacity: 0.75 + (load / 25) * 0.25 }} />;
          })}
          {risks.map((r) => (
            <div
              key={r.id}
              className="dot-anim absolute flex items-center justify-center"
              style={{
                left: `${((r.impact - 0.5) / 5) * 100}%`,
                top: `${((5.5 - r.probability) / 5) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title={`${r.name} — P${r.probability} × I${r.impact}`}
            >
              <span
                className="anim-pulse-dot block h-4 w-4 cursor-help rounded-full border-2 border-[var(--raise)] shadow-[var(--shadow-sm)]"
                style={{ background: colorFor?.(r.optionId) ?? 'var(--coral)' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between font-data text-[9.5px] text-[var(--faint)]">
          <span>impact 1</span>
          <span className="text-[var(--muted)]">→ 5</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Weight strip ---------------------------- */

export function WeightStrip({
  criteria,
  weights,
  activeId,
  onSelect,
}: {
  criteria: Criterion[];
  weights: Record<string, number>; // normalized 0..1
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex h-3.5 w-full overflow-hidden rounded-full border border-[var(--line)]">
        {criteria.map((c, i) => {
          const w = weights[c.id] ?? 0;
          if (w <= 0.001) return null;
          const hue = ['#0e8a68', '#c07b21', '#4a7fae', '#a85673', '#7c8a45', '#6f7fae', '#b06a3b'][i % 7];
          return (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              className="bar-anim h-full cursor-pointer transition-opacity hover:opacity-80"
              style={{
                width: `${w * 100}%`,
                background: hue,
                opacity: activeId && activeId !== c.id ? 0.35 : 1,
              }}
              aria-label={`${c.name}: ${Math.round(w * 100)}% of weight`}
            />
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {criteria.map((c, i) => {
          const hue = ['#0e8a68', '#c07b21', '#4a7fae', '#a85673', '#7c8a45', '#6f7fae', '#b06a3b'][i % 7];
          return (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              className="flex cursor-pointer items-center gap-1.5 text-[11.5px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            >
              <span className="h-2 w-2 rounded-[3px]" style={{ background: hue }} />
              {c.name}
              <span className="font-data text-[10.5px] text-[var(--faint)]">
                {Math.round((weights[c.id] ?? 0) * 100)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- Gauge -------------------------------- */

export function Gauge({
  value,
  size = 120,
  label,
  color,
}: {
  value: number; // 0..100
  size?: number;
  label?: string;
  color?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const animV = useTweenNumber(v);
  const stroke = color ?? (v >= 66 ? 'var(--teal)' : v >= 40 ? 'var(--amber)' : 'var(--coral)');
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.62} viewBox="0 0 120 74">
        <path d="M 10 68 A 50 50 0 0 1 110 68" fill="none" stroke="var(--sunken)" strokeWidth={10} strokeLinecap="round" />
        <path
          d="M 10 68 A 50 50 0 0 1 110 68"
          fill="none"
          stroke={stroke}
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${(animV / 100) * 100} 100`}
          className="gauge-anim"
        />
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fill="var(--ink)"
          fontSize="21"
          fontWeight="600"
          fontFamily="Space Grotesk, sans-serif"
        >
          {Math.round(animV)}
        </text>
      </svg>
      {label && <span className="mt-0.5 font-data text-[10px] uppercase tracking-wider text-[var(--faint)]">{label}</span>}
    </div>
  );
}

/* ----------------------------- Sparkline ------------------------------ */

export function Spark({ points, color = 'var(--teal)', w = 88, h = 26 }: { points: number[]; color?: string; w?: number; h?: number }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const rng = max - min || 1;
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i / (points.length - 1)) * w},${h - 3 - ((p - min) / rng) * (h - 6)}`)
    .join(' ');
  return (
    <svg width={w} height={h} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <circle
        cx={w}
        cy={h - 3 - ((points[points.length - 1] - min) / rng) * (h - 6)}
        r={2.4}
        fill={color}
      />
    </svg>
  );
}
