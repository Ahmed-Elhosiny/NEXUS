import { useMemo, useState, type ReactNode } from 'react';
import type { Decision, JournalKind, Reliability, Stance } from '../../types';
import { cn, fmtDateLong, riskLoad, timeAgo } from '../../lib/engine';
import { useStore } from '../../store';
import {
  Badge,
  Button,
  Confirm,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
  type Tone,
} from '../../components/ui';
import { RiskMatrix } from '../../components/charts';
import {
  IcBook,
  IcCheck,
  IcClock,
  IcCompass,
  IcDoc,
  IcFlag,
  IcLayers,
  IcPlus,
  IcScale,
  IcShield,
  IcSpark,
  IcTrash,
} from '../../components/icons';

const STANCE_TONE: Record<Stance, Tone> = { supporting: 'teal', contradicting: 'coral', neutral: 'neutral' };

/* =============================== evidence =============================== */

export function EvidenceTab({ d }: { d: Decision }) {
  const addEvidence = useStore((s) => s.addEvidence);
  const removeEvidence = useStore((s) => s.removeEvidence);
  const [filter, setFilter] = useState<'all' | Stance>('all');
  const [optionFilter, setOptionFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [del, setDel] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [source, setSource] = useState('');
  const [reliability, setReliability] = useState<Reliability>('medium');
  const [stance, setStance] = useState<Stance>('supporting');
  const [optionId, setOptionId] = useState('');
  const [criterionId, setCriterionId] = useState('');
  const [err, setErr] = useState('');

  const items = useMemo(
    () =>
      d.evidence.filter(
        (e) =>
          (filter === 'all' || e.stance === filter) &&
          (optionFilter === 'all' || e.optionId === optionFilter),
      ),
    [d.evidence, filter, optionFilter],
  );

  const submit = () => {
    if (!title.trim()) {
      setErr('A title is required.');
      return;
    }
    addEvidence(d.id, {
      title: title.trim(),
      description: desc.trim(),
      source: source.trim() || 'Unspecified',
      reliability,
      stance,
      optionId: optionId || undefined,
      criterionId: criterionId || undefined,
    });
    setFormOpen(false);
    setTitle(''); setDesc(''); setSource(''); setErr('');
  };

  const relBar = (r: Reliability) => (r === 'high' ? 100 : r === 'medium' ? 60 : 30);
  const relColor = (r: Reliability) => (r === 'high' ? 'var(--teal)' : r === 'medium' ? 'var(--amber)' : 'var(--coral)');

  return (
    <div className="anim-fade-up">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div>
          <h2 className="font-display text-[19px] font-bold tracking-tight">Evidence</h2>
          <p className="mt-0.5 text-[13.5px] text-[var(--muted)]">
            {d.evidence.length} items · {d.evidence.filter((e) => e.stance === 'supporting').length} supporting ·{' '}
            {d.evidence.filter((e) => e.stance === 'contradicting').length} contradicting
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {(['all', 'supporting', 'contradicting', 'neutral'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer capitalize',
                filter === f ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-[var(--sunken)] text-[var(--muted)] hover:text-[var(--ink)]',
              )}
            >
              {f}
            </button>
          ))}
          <Select value={optionFilter} onChange={(e) => setOptionFilter(e.target.value)} className="h-8 w-40 text-[12px]" aria-label="Filter by option">
            <option value="all">All options</option>
            {d.options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
          <Button size="sm" className="h-8" onClick={() => setFormOpen(true)}><IcPlus size={13} /> Evidence</Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IcDoc size={20} />}
          title={d.evidence.length === 0 ? 'No evidence yet' : 'Nothing matches these filters'}
          body={
            d.evidence.length === 0
              ? 'Your model is running on vibes. Attach sources, tests and hard numbers — and hunt especially for evidence against your favorite option.'
              : 'Loosen the stance or option filter to see the rest of the dossier.'
          }
          action={d.evidence.length === 0 ? <Button onClick={() => setFormOpen(true)}><IcPlus size={14} /> Add first evidence</Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((e) => {
            const opt = d.options.find((o) => o.id === e.optionId);
            const crit = d.criteria.find((c) => c.id === e.criterionId);
            return (
              <article
                key={e.id}
                className="group relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                style={{ borderLeftWidth: 3, borderLeftColor: e.stance === 'supporting' ? 'var(--teal)' : e.stance === 'contradicting' ? 'var(--coral)' : 'var(--line-strong)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={STANCE_TONE[e.stance]}>{e.stance}</Badge>
                  <button
                    onClick={() => setDel(e.id)}
                    className="rounded-md p-1 text-[var(--faint)] opacity-0 transition-all hover:bg-[var(--coral-soft)] hover:text-[var(--coral)] group-hover:opacity-100 cursor-pointer"
                    aria-label={`Delete ${e.title}`}
                  >
                    <IcTrash size={13} />
                  </button>
                </div>
                <h3 className="mt-2 font-display text-[14.5px] font-semibold leading-snug">{e.title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">{e.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {opt && (
                    <span className="flex items-center gap-1.5 rounded-md bg-[var(--sunken)] px-1.5 py-0.5 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: opt.color }} /> {opt.name}
                    </span>
                  )}
                  {crit && <Badge tone="neutral"><IcScale size={10} /> {crit.name}</Badge>}
                  <span className="ml-auto font-data text-[10.5px] text-[var(--faint)]">{e.source} · {timeAgo(e.date)}</span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="font-data text-[10px] uppercase tracking-wider text-[var(--faint)]">reliability</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--sunken)]">
                    <div className="h-full rounded-full" style={{ width: `${relBar(e.reliability)}%`, background: relColor(e.reliability) }} />
                  </div>
                  <span className="font-data text-[10.5px] font-semibold" style={{ color: relColor(e.reliability) }}>{e.reliability}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add evidence" wide>
        <div className="space-y-4">
          <div>
            <Label hint="required">Title</Label>
            <Input autoFocus value={title} onChange={(e) => { setTitle(e.target.value); setErr(''); }} placeholder="e.g. NotebookCheck battery rundown" />
            {err && <p className="mt-1 text-[12px] font-medium text-[var(--coral)]">{err}</p>}
          </div>
          <div>
            <Label>What does it show?</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Numbers, quotes, findings…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Source</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="notebookcheck.net" />
            </div>
            <div>
              <Label>Reliability</Label>
              <Select value={reliability} onChange={(e) => setReliability(e.target.value as Reliability)}>
                <option value="high">High — measured / primary</option>
                <option value="medium">Medium — reported / secondary</option>
                <option value="low">Low — anecdote / rumor</option>
              </Select>
            </div>
            <div>
              <Label>Stance</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['supporting', 'contradicting', 'neutral'] as Stance[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStance(s)}
                    className={cn(
                      'rounded-lg border px-2 py-1.5 text-[12px] font-medium capitalize transition-all cursor-pointer',
                      stance === s
                        ? s === 'contradicting'
                          ? 'border-[var(--coral)] bg-[var(--coral-soft)] text-[var(--coral)]'
                          : s === 'supporting'
                            ? 'border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]'
                            : 'border-[var(--line-strong)] bg-[var(--sunken)]'
                        : 'border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)]',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Relates to</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Select value={optionId} onChange={(e) => setOptionId(e.target.value)} aria-label="Related option">
                  <option value="">No option</option>
                  {d.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </Select>
                <Select value={criterionId} onChange={(e) => setCriterionId(e.target.value)} aria-label="Related criterion">
                  <option value="">No criterion</option>
                  {d.criteria.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={submit}><IcDoc size={14} /> Attach evidence</Button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={del !== null}
        onClose={() => setDel(null)}
        onConfirm={() => del && removeEvidence(d.id, del)}
        title="Remove this evidence?"
        body="It will no longer inform the confidence calculation or the evidence balance."
        confirmLabel="Remove"
      />
    </div>
  );
}

/* ================================ risks ================================= */

function LevelDots({ value, onChange, color, label }: { value: number; onChange: (v: number) => void; color: string; label: string }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          role="radio"
          aria-checked={value === i}
          aria-label={`${label} ${i}`}
          onClick={() => onChange(i)}
          className="h-4 w-4 rounded-full border transition-all hover:scale-110 cursor-pointer"
          style={{
            background: i <= value ? color : 'transparent',
            borderColor: i <= value ? color : 'var(--line-strong)',
          }}
        />
      ))}
    </div>
  );
}

export function RisksTab({ d }: { d: Decision }) {
  const addRisk = useStore((s) => s.addRisk);
  const updateRisk = useStore((s) => s.updateRisk);
  const removeRisk = useStore((s) => s.removeRisk);
  const [formOpen, setFormOpen] = useState(false);
  const [del, setDel] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [prob, setProb] = useState(3);
  const [impact, setImpact] = useState(3);
  const [mitigation, setMitigation] = useState('');
  const [optionId, setOptionId] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setErr('Name the risk — vague risks get ignored.');
      return;
    }
    addRisk(d.id, { name: name.trim(), probability: prob, impact, mitigation: mitigation.trim() || 'None planned.', optionId: optionId || undefined });
    setFormOpen(false);
    setName(''); setMitigation(''); setProb(3); setImpact(3); setErr('');
  };

  return (
    <div className="anim-fade-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] font-bold tracking-tight">Risks</h2>
          <p className="mt-0.5 text-[13.5px] text-[var(--muted)]">
            {d.risks.length} mapped · each P×I flows into the option's score penalty.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}><IcPlus size={14} /> Map a risk</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          {d.risks.length === 0 && (
            <EmptyState
              icon={<IcShield size={20} />}
              title="Unmapped risks are the expensive kind"
              body="For every option, ask: what would make me regret this in six months? Plot probability × impact and plan the mitigation before you need it."
              action={<Button onClick={() => setFormOpen(true)}><IcPlus size={14} /> Map first risk</Button>}
            />
          )}
          {[...d.risks].sort((a, b) => riskLoad(b) - riskLoad(a)).map((r) => {
            const opt = d.options.find((o) => o.id === r.optionId);
            const load = riskLoad(r);
            return (
              <article key={r.id} className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-[14.5px] font-semibold">{r.name}</h3>
                    {opt && (
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: opt.color }} /> threatens {opt.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={load >= 15 ? 'coral' : load >= 8 ? 'amber' : 'neutral'}>P×I {load}</Badge>
                    <button
                      onClick={() => setDel(r.id)}
                      className="rounded-md p-1 text-[var(--faint)] opacity-0 transition-all hover:bg-[var(--coral-soft)] hover:text-[var(--coral)] group-hover:opacity-100 cursor-pointer"
                      aria-label={`Delete ${r.name}`}
                    >
                      <IcTrash size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
                    probability
                    <LevelDots value={r.probability} color="var(--amber)" label={`${r.name} probability`} onChange={(v) => updateRisk(d.id, r.id, { probability: v })} />
                  </label>
                  <label className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
                    impact
                    <LevelDots value={r.impact} color="var(--coral)" label={`${r.name} impact`} onChange={(v) => updateRisk(d.id, r.id, { impact: v })} />
                  </label>
                </div>
                <p className="mt-2.5 rounded-lg bg-[var(--sunken)]/70 px-3 py-2 text-[12.5px] leading-relaxed text-[var(--muted)]">
                  <span className="font-data mr-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--teal)]">mitigation</span>
                  {r.mitigation}
                </p>
              </article>
            );
          })}
        </div>

        <section className="h-fit rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] lg:sticky lg:top-[72px]">
          <h3 className="font-display text-[14px] font-semibold">Probability × impact</h3>
          <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">Adjust a risk's dots and watch it jump quadrants.</p>
          <div className="mt-3">
            <RiskMatrix risks={d.risks} colorFor={(oid) => d.options.find((o) => o.id === oid)?.color ?? 'var(--coral)'} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {d.options.map((o) => (
              <span key={o.id} className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full" style={{ background: o.color }} /> {o.name}
              </span>
            ))}
          </div>
        </section>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Map a risk" wide>
        <div className="space-y-4">
          <div>
            <Label hint="required">What could go wrong?</Label>
            <Input autoFocus value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="e.g. Budget overrun this quarter" />
            {err && <p className="mt-1 text-[12px] font-medium text-[var(--coral)]">{err}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label hint={`${prob}/5`}>Probability</Label>
              <LevelDots value={prob} onChange={setProb} color="var(--amber)" label="Probability" />
            </div>
            <div>
              <Label hint={`${impact}/5`}>Impact</Label>
              <LevelDots value={impact} onChange={setImpact} color="var(--coral)" label="Impact" />
            </div>
          </div>
          <div>
            <Label>Mitigation</Label>
            <Textarea value={mitigation} onChange={(e) => setMitigation(e.target.value)} placeholder="How would you soften or dodge it?" />
          </div>
          <div>
            <Label>Threatens option</Label>
            <Select value={optionId} onChange={(e) => setOptionId(e.target.value)}>
              <option value="">Whole decision</option>
              {d.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Badge tone={prob * impact >= 15 ? 'coral' : prob * impact >= 8 ? 'amber' : 'teal'}>load {prob * impact} · {prob * impact >= 15 ? 'severe' : prob * impact >= 8 ? 'notable' : 'manageable'}</Badge>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={submit}><IcShield size={14} /> Map risk</Button>
            </div>
          </div>
        </div>
      </Modal>

      <Confirm
        open={del !== null}
        onClose={() => setDel(null)}
        onConfirm={() => del && removeRisk(d.id, del)}
        title="Remove this risk?"
        body="Its penalty contribution is removed from the affected option's score immediately."
        confirmLabel="Remove risk"
      />
    </div>
  );
}

/* =============================== timeline =============================== */

const TL_META: Record<string, { icon: ReactNode; color: string }> = {
  created: { icon: <IcCompass size={13} />, color: 'var(--blue)' },
  options: { icon: <IcCompass size={13} />, color: 'var(--teal)' },
  criteria: { icon: <IcScale size={13} />, color: 'var(--teal)' },
  evidence: { icon: <IcDoc size={13} />, color: 'var(--amber)' },
  risk: { icon: <IcShield size={13} />, color: 'var(--coral)' },
  model: { icon: <IcSpark size={13} />, color: 'var(--teal)' },
  scenario: { icon: <IcLayers size={13} />, color: 'var(--blue)' },
  journal: { icon: <IcBook size={13} />, color: 'var(--amber)' },
  decided: { icon: <IcFlag size={13} />, color: 'var(--teal)' },
};

export function TimelineTab({ d }: { d: Decision }) {
  const events = useMemo(() => [...d.timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [d.timeline]);
  return (
    <div className="anim-fade-up mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="font-display text-[19px] font-bold tracking-tight">Timeline</h2>
        <p className="mt-0.5 text-[13.5px] text-[var(--muted)]">The audit trail of this decision — every move, in order.</p>
      </div>
      <div className="relative pl-8">
        <div className="absolute bottom-2 left-[13px] top-2 w-px bg-[var(--line-strong)]" />
        <ol className="space-y-5">
          {events.map((e, i) => {
            const meta = TL_META[e.type] ?? TL_META.model;
            return (
              <li key={e.id} className="relative">
                <span
                  className={cn('absolute -left-8 top-0.5 flex h-[27px] w-[27px] items-center justify-center rounded-full border-2 bg-[var(--surface)]', i === 0 && 'anim-pulse-dot')}
                  style={{ borderColor: meta.color, color: meta.color }}
                >
                  {meta.icon}
                </span>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[13.5px] font-semibold">{e.label}</p>
                    <span className="font-data text-[10.5px] text-[var(--faint)]" title={fmtDateLong(e.date)}>{timeAgo(e.date)}</span>
                  </div>
                  {e.detail && <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">{e.detail}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-6 flex items-center gap-2 font-data text-[10.5px] text-[var(--faint)]">
        <IcClock size={12} /> events are appended automatically as you build — created {fmtDateLong(d.createdAt)}
      </p>
    </div>
  );
}

/* ================================ journal =============================== */

const KIND_META: Record<JournalKind, { label: string; tone: Tone }> = {
  why: { label: 'the why', tone: 'blue' },
  expectation: { label: 'expectation', tone: 'amber' },
  outcome: { label: 'reality', tone: 'teal' },
};

export function JournalTab({ d }: { d: Decision }) {
  const addJournal = useStore((s) => s.addJournal);
  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState<JournalKind>('why');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [err, setErr] = useState('');

  const exp = d.journal.find((j) => j.kind === 'expectation');
  const out = d.journal.find((j) => j.kind === 'outcome');

  const submit = () => {
    if (!title.trim() || !body.trim()) {
      setErr('Both a title and an entry are required.');
      return;
    }
    addJournal(d.id, { kind, title: title.trim(), body: body.trim() });
    setFormOpen(false);
    setTitle(''); setBody(''); setErr('');
  };

  return (
    <div className="anim-fade-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] font-bold tracking-tight">Decision journal</h2>
          <p className="mt-0.5 max-w-xl text-[13.5px] text-[var(--muted)]">
            Memory rewrites history. The journal doesn't — write the why, set the expectation, then let reality report back.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}><IcPlus size={14} /> New entry</Button>
      </div>

      {(exp || out) && (
        <section className="mb-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <p className="border-b border-[var(--line)] bg-[var(--sunken)]/60 px-4 py-2 font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">
            expected vs reality
          </p>
          <div className="grid md:grid-cols-2">
            <div className="border-b border-[var(--line)] p-4 md:border-b-0 md:border-r">
              <p className="flex items-center gap-1.5 font-data text-[10.5px] font-semibold uppercase tracking-widest text-[var(--amber)]">
                <IcClock size={12} /> expected{exp && ` · ${timeAgo(exp.date)}`}
              </p>
              {exp ? (
                <>
                  <p className="mt-1.5 font-display text-[14px] font-semibold">{exp.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">{exp.body}</p>
                </>
              ) : (
                <p className="mt-2 text-[13px] text-[var(--faint)]">No expectation logged yet — set one before the outcome arrives, or the comparison is theater.</p>
              )}
            </div>
            <div className="p-4">
              <p className="flex items-center gap-1.5 font-data text-[10.5px] font-semibold uppercase tracking-widest text-[var(--teal)]">
                <IcCheck size={12} /> reality{out && ` · ${timeAgo(out.date)}`}
              </p>
              {out ? (
                <>
                  <p className="mt-1.5 font-display text-[14px] font-semibold">{out.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">{out.body}</p>
                </>
              ) : (
                <p className="mt-2 text-[13px] text-[var(--faint)]">Reality hasn't reported back. When it does, log it — that's where the calibration lives.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {d.journal.length === 0 ? (
        <EmptyState
          icon={<IcBook size={20} />}
          title="An unexamined decision"
          body="Start with the why. Future-you will want to know what past-you was thinking — and whether it held up."
          action={<Button onClick={() => setFormOpen(true)}><IcPlus size={14} /> Write first entry</Button>}
        />
      ) : (
        <div className="space-y-3">
          {[...d.journal].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((j) => {
            const meta = KIND_META[j.kind];
            return (
              <article key={j.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                <div className="flex items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="ml-auto font-data text-[10.5px] text-[var(--faint)]">{fmtDateLong(j.date)}</span>
                </div>
                <h3 className="mt-2 font-display text-[15px] font-semibold">{j.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--muted)]">{j.body}</p>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Journal entry" wide>
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(KIND_META) as JournalKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-[12.5px] font-medium capitalize transition-all cursor-pointer',
                    kind === k ? 'border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]' : 'border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)]',
                  )}
                >
                  {KIND_META[k].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label hint="required">Title</Label>
            <Input autoFocus value={title} onChange={(e) => { setTitle(e.target.value); setErr(''); }} placeholder={kind === 'expectation' ? 'What should be true in 3 months?' : 'Say it plainly'} />
            {err && <p className="mt-1 text-[12px] font-medium text-[var(--coral)]">{err}</p>}
          </div>
          <div>
            <Label hint="required">Entry</Label>
            <Textarea rows={5} value={body} onChange={(e) => { setBody(e.target.value); setErr(''); }} placeholder="Write for the person who has to live with this decision…" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={submit}><IcBook size={14} /> Save entry</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
