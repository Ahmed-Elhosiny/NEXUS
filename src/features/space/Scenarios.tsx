import { useMemo, useState } from 'react';
import type { Decision } from '../../types';
import { cn, computeModel, normalizedWeights, type ModelResult } from '../../lib/engine';
import { useStore } from '../../store';
import { Badge, Button, Confirm, EmptyState, Input, Label, Modal, RangeSlider, Textarea } from '../../components/ui';
import { RankBars } from '../../components/charts';
import { IcCompass, IcLayers, IcPlus, IcTrash } from '../../components/icons';

export default function Scenarios({ d, model }: { d: Decision; model: ModelResult }) {
  const addScenario = useStore((s) => s.addScenario);
  const removeScenario = useStore((s) => s.removeScenario);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const norm = normalizedWeights(d.criteria);

  const openCreate = () => {
    setWeights(Object.fromEntries(d.criteria.map((c) => [c.id, c.weight])));
    setName('');
    setNote('');
    setCreateOpen(true);
  };

  const save = () => {
    if (!name.trim()) return;
    addScenario(d.id, { name: name.trim(), note: note.trim() || undefined, weightOverrides: weights, scoreOverrides: {} });
    setCreateOpen(false);
  };

  if (d.options.length === 0) {
    return (
      <EmptyState
        icon={<IcLayers size={20} />}
        title="Scenarios need a model first"
        body="Add options and criteria on the Canvas — then freeze alternate versions of reality here."
      />
    );
  }

  return (
    <div className="anim-fade-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] font-bold tracking-tight">Scenario comparison</h2>
          <p className="mt-1 max-w-xl text-[13.5px] text-[var(--muted)]">
            Each scenario re-runs the model under a different set of weights. See where your recommendation is robust — and where it's a creature of circumstance.
          </p>
        </div>
        <Button onClick={openCreate}><IcPlus size={14} /> New scenario</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* baseline */}
        <ScenarioCard
          name="Baseline"
          note="Your committed weights — the reference world."
          result={model}
          baseline={model}
          baseNorm={norm}
          scNorm={norm}
          isBaseline
        />
        {d.scenarios.map((sc) => {
          const res = computeModel(d, { weights: sc.weightOverrides, scores: sc.scoreOverrides });
          const scNorm = normalizedWeights(d.criteria, sc.weightOverrides);
          return (
            <ScenarioCard
              key={sc.id}
              name={sc.name}
              note={sc.note}
              result={res}
              baseline={model}
              baseNorm={norm}
              scNorm={scNorm}
              onDelete={() => setConfirmId(sc.id)}
            />
          );
        })}

        {/* create tile */}
        <button
          onClick={openCreate}
          className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--line-strong)] text-[var(--muted)] transition-all hover:-translate-y-0.5 hover:border-[var(--teal)] hover:text-[var(--teal)] cursor-pointer"
        >
          <IcPlus size={20} />
          <span className="text-[13.5px] font-semibold">Freeze another world</span>
          <span className="px-6 text-center font-data text-[10.5px] text-[var(--faint)]">tight budget · remote confirmed · risk-paranoid…</span>
        </button>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New scenario" wide>
        <div className="space-y-4">
          <div>
            <Label hint="required">Name</Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. “Budget = $1,000”" />
          </div>
          <div>
            <Label>What's different in this world?</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bonus slips to zero, so price matters twice as much…" />
          </div>
          <div>
            <Label hint="start from your base weights">Criteria weights</Label>
            <div className="max-h-64 space-y-2.5 overflow-y-auto rounded-xl border border-[var(--line)] p-3">
              {d.criteria.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between text-[12.5px]">
                    <span className="font-medium">{c.name}</span>
                    <span className="font-data text-[11px] text-[var(--muted)]">{weights[c.id] ?? c.weight}</span>
                  </div>
                  <RangeSlider
                    value={weights[c.id] ?? c.weight}
                    min={0}
                    max={40}
                    ariaLabel={`${c.name} scenario weight`}
                    onChange={(v) => setWeights((w) => ({ ...w, [c.id]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!name.trim()}><IcLayers size={14} /> Create scenario</Button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && removeScenario(d.id, confirmId)}
        title="Delete this scenario?"
        body="The frozen world is discarded. Your base model is untouched."
        confirmLabel="Delete scenario"
      />
    </div>
  );
}

function ScenarioCard({
  name,
  note,
  result,
  baseline,
  baseNorm,
  scNorm,
  isBaseline,
  onDelete,
}: {
  name: string;
  note?: string;
  result: ModelResult;
  baseline: ModelResult;
  baseNorm: Record<string, number>;
  scNorm: Record<string, number>;
  isBaseline?: boolean;
  onDelete?: () => void;
}) {
  const winner = result.winner;
  const diverges = !!winner && !!baseline.winner && winner.option.id !== baseline.winner.option.id;
  const scoreDelta = winner && baseline.winner && winner.option.id === baseline.winner.option.id
    ? winner.adjusted - (baseline.rows.find((r) => r.option.id === winner.option.id)?.adjusted ?? 0)
    : null;

  const weightDiffs = useMemo(() => {
    if (isBaseline) return [];
    return Object.keys(scNorm)
      .map((id) => ({ id, delta: (scNorm[id] ?? 0) - (baseNorm[id] ?? 0) }))
      .filter((x) => Math.abs(x.delta) > 0.005)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3);
  }, [scNorm, baseNorm, isBaseline]);

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
        isBaseline ? 'border-[var(--line-strong)]' : diverges ? 'border-[var(--amber)]/60' : 'border-[var(--line)]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-[15px] font-semibold">{name}</p>
          {note && <p className="mt-0.5 text-[12px] leading-snug text-[var(--muted)]">{note}</p>}
        </div>
        {isBaseline ? (
          <Badge tone="teal">reference</Badge>
        ) : (
          <div className="flex gap-1">
            {diverges && <Badge tone="amber">diverges</Badge>}
            <button onClick={onDelete} className="rounded-md p-1 text-[var(--faint)] transition-colors hover:bg-[var(--coral-soft)] hover:text-[var(--coral)] cursor-pointer" aria-label={`Delete ${name}`}>
              <IcTrash size={13} />
            </button>
          </div>
        )}
      </div>

      {weightDiffs.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {weightDiffs.map((w) => (
            <span key={w.id} className="rounded-md bg-[var(--sunken)] px-1.5 py-0.5 font-data text-[10px] text-[var(--muted)]">
              {w.delta > 0 ? '▲' : '▼'} {Math.abs(Math.round(w.delta * 100))}pp
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-xl bg-[var(--sunken)]/70 px-3 py-2.5">
        <p className="font-data text-[9.5px] font-semibold uppercase tracking-widest text-[var(--faint)]">recommends</p>
        {winner ? (
          <p className="mt-0.5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: winner.option.color }} />
            <span className="truncate font-display text-[14.5px] font-semibold">{winner.option.name}</span>
            <span className="ml-auto shrink-0 font-data text-[12px] font-semibold text-[var(--teal)]">
              {winner.adjusted.toFixed(1)}
              {scoreDelta !== null && Math.abs(scoreDelta) >= 0.1 && (
                <span className={scoreDelta > 0 ? 'text-[var(--teal)]' : 'text-[var(--coral)]'}>
                  {' '}{scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)}
                </span>
              )}
            </span>
          </p>
        ) : (
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[var(--faint)]"><IcCompass size={13} /> no live options</p>
        )}
      </div>

      <div className="mt-3 flex-1">
        <RankBars rows={result.rows.map((r) => ({ id: r.option.id, label: r.option.name, color: r.option.color, value: r.adjusted }))} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--line)] pt-2.5">
        <Badge tone={result.confidence >= 66 ? 'teal' : result.confidence >= 40 ? 'amber' : 'coral'}>conf {result.confidence}%</Badge>
        <Badge tone={result.riskLevel === 'high' ? 'coral' : result.riskLevel === 'medium' ? 'amber' : 'teal'}>risk {result.riskLevel}</Badge>
        {baseline.runnerUp && result.runnerUp && (
          <span className="ml-auto font-data text-[10.5px] text-[var(--faint)]">margin {result.margin.toFixed(1)}</span>
        )}
      </div>
    </div>
  );
}
