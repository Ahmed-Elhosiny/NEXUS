import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Decision, Overrides } from '../../types';
import { cn, computeModel, describeDiff, normalizedWeights, type ModelResult } from '../../lib/engine';
import { useStore } from '../../store';
import { Badge, Button, EmptyState, Input, Modal, RangeSlider, Select } from '../../components/ui';
import { Gauge, RankBars } from '../../components/charts';
import { IcArrowRight, IcLayers, IcRefresh, IcSliders, IcSpark } from '../../components/icons';

export default function WhatIf({ d, model }: { d: Decision; model: ModelResult }) {
  const nav = useNavigate();
  const addScenario = useStore((s) => s.addScenario);
  const toast = useStore((s) => s.toast);

  const baseWeights = useMemo(() => Object.fromEntries(d.criteria.map((c) => [c.id, c.weight])), [d.criteria]);
  const baseScores = useMemo(
    () => Object.fromEntries(d.options.map((o) => [o.id, { ...o.scores }])),
    [d.options],
  );

  const [weights, setWeights] = useState<Record<string, number>>(baseWeights);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(baseScores);
  const [riskMult, setRiskMult] = useState(1);
  const [scoreOpt, setScoreOpt] = useState(d.options[0]?.id ?? '');
  const [saveOpen, setSaveOpen] = useState(false);
  const [scName, setScName] = useState('');

  const overrides: Overrides = useMemo(
    () => ({ weights, scores, riskMultiplier: riskMult }),
    [weights, scores, riskMult],
  );

  const live = useMemo(() => computeModel(d, overrides), [d, overrides]);
  const insights = useMemo(() => describeDiff(model, live), [model, live]);
  const dirty =
    JSON.stringify(weights) !== JSON.stringify(baseWeights) ||
    JSON.stringify(scores) !== JSON.stringify(baseScores) ||
    riskMult !== 1;

  const norm = normalizedWeights(d.criteria, weights);
  const flipped = live.winner && model.winner && live.winner.option.id !== model.winner.option.id;

  const reset = () => {
    setWeights(baseWeights);
    setScores(baseScores);
    setRiskMult(1);
    toast('What-If reset to the base model', 'info');
  };

  const save = () => {
    if (!scName.trim()) return;
    addScenario(d.id, { name: scName.trim(), note: 'Saved from What-If mode', weightOverrides: weights, scoreOverrides: scores });
    toast(`Scenario “${scName.trim()}” saved`);
    setSaveOpen(false);
    setScName('');
  };

  const activeOption = d.options.find((o) => o.id === scoreOpt) ?? d.options[0];

  if (d.options.length === 0 || d.criteria.length === 0) {
    return (
      <EmptyState
        icon={<IcSliders size={20} />}
        title="Nothing to simulate yet"
        body="What-If bends an existing model. Add options and criteria on the Canvas first, then come back to stress-test them."
      />
    );
  }

  return (
    <div className="anim-fade-up">
      {/* flip banner */}
      {dirty && live.winner && (
        <div
          className={cn(
            'anim-pop mb-5 flex flex-wrap items-center gap-2.5 rounded-2xl border px-4 py-3',
            flipped ? 'border-[var(--amber)] bg-[var(--amber-soft)]/50' : 'border-[var(--teal)]/40 bg-[var(--teal-soft)]/40',
          )}
          role="status"
          aria-live="polite"
        >
          <IcSliders size={16} className={flipped ? 'text-[var(--amber)]' : 'text-[var(--teal)]'} />
          <p className="text-[13.5px] font-medium">
            {flipped ? (
              <>
                The recommendation flips: <span className="font-semibold">{model.winner?.option.name}</span>
                <IcArrowRight size={12} className="mx-1.5 inline" />
                <span className="font-semibold" style={{ color: live.winner.option.color }}>{live.winner.option.name}</span>
                {' '}under these assumptions.
              </>
            ) : (
              <>
                <span className="font-semibold">{live.winner.option.name}</span> still leads — by{' '}
                <span className="font-data font-semibold">{live.margin.toFixed(1)} pts</span> under this configuration.
              </>
            )}
          </p>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={reset}>
            <IcRefresh size={13} /> Reset
          </Button>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* controls */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <h3 className="font-display flex items-center gap-2 text-[14px] font-semibold">
              <IcSliders size={15} className="text-[var(--teal)]" /> Criteria weights
            </h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">Base values shown as normalized % — drag to rewrite reality.</p>
            <div className="mt-3 space-y-3">
              {d.criteria.map((c) => {
                const changed = weights[c.id] !== baseWeights[c.id];
                return (
                  <div key={c.id}>
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className={cn('font-medium', changed && 'text-[var(--amber)]')}>{c.name}</span>
                      <span className="font-data text-[11px]">
                        <span className={changed ? 'font-semibold text-[var(--amber)]' : 'text-[var(--muted)]'}>
                          {Math.round((norm[c.id] ?? 0) * 100)}%
                        </span>
                        {changed && <span className="text-[var(--faint)]"> · was {Math.round((normalizedWeights(d.criteria)[c.id] ?? 0) * 100)}%</span>}
                      </span>
                    </div>
                    <RangeSlider
                      value={weights[c.id] ?? c.weight}
                      min={0}
                      max={40}
                      tone={changed ? 'amber' : 'teal'}
                      ariaLabel={`${c.name} hypothetical weight`}
                      onChange={(v) => setWeights((w) => ({ ...w, [c.id]: v }))}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <h3 className="font-display text-[14px] font-semibold">Option scores</h3>
            <Select className="mt-2.5" value={activeOption?.id ?? ''} onChange={(e) => setScoreOpt(e.target.value)} aria-label="Option to rescore">
              {d.options.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
            {activeOption && (
              <div className="mt-3 space-y-3">
                {d.criteria.map((c) => {
                  const cur = scores[activeOption.id]?.[c.id] ?? activeOption.scores[c.id] ?? 5;
                  const base = baseScores[activeOption.id]?.[c.id] ?? 5;
                  const changed = cur !== base;
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between text-[12.5px]">
                        <span className={cn('font-medium', changed && 'text-[var(--amber)]')}>{c.name}</span>
                        <span className={cn('font-data text-[11px]', changed ? 'font-semibold text-[var(--amber)]' : 'text-[var(--muted)]')}>
                          {cur}/10{changed && ` · was ${base}`}
                        </span>
                      </div>
                      <RangeSlider
                        value={cur}
                        min={0}
                        max={10}
                        tone={changed ? 'amber' : 'teal'}
                        ariaLabel={`${activeOption.name} hypothetical ${c.name}`}
                        onChange={(v) =>
                          setScores((s) => ({
                            ...s,
                            [activeOption.id]: { ...(s[activeOption.id] ?? {}), [c.id]: v },
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <h3 className="font-display text-[14px] font-semibold">Risk severity</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">Multiply every risk penalty — simulate a calm world or a paranoid one.</p>
            <div className="mt-2 flex items-center gap-3">
              <RangeSlider
                value={riskMult * 50}
                min={0}
                max={100}
                tone={riskMult !== 1 ? 'amber' : 'teal'}
                ariaLabel="Risk multiplier"
                onChange={(v) => setRiskMult(v / 50)}
              />
              <span className={cn('font-data w-14 text-right text-[13px] font-semibold', riskMult !== 1 ? 'text-[var(--amber)]' : 'text-[var(--muted)]')}>
                ×{riskMult.toFixed(2)}
              </span>
            </div>
          </section>
        </div>

        {/* results */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-[14.5px] font-semibold">Live result</h3>
                <p className="text-[12px] text-[var(--muted)]">Δ shown against the base model.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={reset} disabled={!dirty}>
                  <IcRefresh size={13} /> Reset
                </Button>
                <Button size="sm" onClick={() => setSaveOpen(true)} disabled={!dirty}>
                  <IcLayers size={13} /> Save as scenario
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <RankBars
                showDelta
                rows={live.rows.map((r) => {
                  const base = model.rows.find((b) => b.option.id === r.option.id);
                  return {
                    id: r.option.id,
                    label: r.option.name,
                    color: r.option.color,
                    value: r.adjusted,
                    delta: base ? r.adjusted - base.adjusted : undefined,
                  };
                })}
              />
              <div className="justify-self-center">
                <Gauge value={live.confidence} label="hypothetical confidence" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="font-display flex items-center gap-2 text-[14.5px] font-semibold">
              <IcSpark size={15} className="text-[var(--teal)]" /> What this change does
            </h3>
            <ul className="mt-3 space-y-2" aria-live="polite">
              {insights.map((msg, i) => (
                <li key={i} className="anim-fade-up flex items-start gap-2.5 rounded-xl bg-[var(--sunken)]/70 px-3 py-2.5 text-[13px] leading-relaxed" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', i === 0 ? 'bg-[var(--teal)]' : 'bg-[var(--line-strong)]')} />
                  {msg}
                </li>
              ))}
            </ul>
            {!dirty && (
              <p className="mt-3 font-data text-[11px] text-[var(--faint)]">
                Nothing modified yet — every number above matches the base model.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-dashed border-[var(--line-strong)] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="amber"><IcSliders size={11} /> sandbox</Badge>
              <p className="flex-1 text-[12.5px] leading-relaxed text-[var(--muted)]">
                What-If never touches your base model. Save a configuration as a scenario to compare it side-by-side, or reset to walk back the experiment.
              </p>
              <Button size="sm" variant="outline" onClick={() => nav(`/app/decision/${d.id}/scenarios`)}>
                Compare scenarios <IcArrowRight size={13} />
              </Button>
            </div>
          </section>
        </div>
      </div>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save as scenario">
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">
          Freezes the current What-If weights and scores into a named world you can compare against the baseline.
        </p>
        <div className="mt-4">
          <Input
            autoFocus
            value={scName}
            onChange={(e) => setScName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="e.g. “If the bonus slips”"
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!scName.trim()}>Save scenario</Button>
        </div>
      </Modal>
    </div>
  );
}
