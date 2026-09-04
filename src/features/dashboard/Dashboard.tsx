import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store';
import { computeModel, daysUntil, fmtDate, timeAgo, cn } from '../../lib/engine';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Label,
  Meter,
  Modal,
  Select,
  StatusPill,
  Textarea,
} from '../../components/ui';
import {
  IcArrowUpRight,
  IcChevronRight,
  IcCompass,
  IcPlus,
  IcSpark,
  IcTarget,
} from '../../components/icons';
import type { Category, Decision } from '../../types';

/* --------------------------- new decision ------------------------------ */

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'career', label: 'Career' },
  { value: 'finance', label: 'Finance' },
  { value: 'tech', label: 'Tech / project' },
  { value: 'life', label: 'Life' },
  { value: 'travel', label: 'Travel' },
];

export function NewDecisionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createDecision = useStore((s) => s.createDecision);
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<Category>('life');
  const [horizon, setHorizon] = useState('1–3 years');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!title.trim()) {
      setError('Give the decision a short title — e.g. “Laptop replacement”.');
      return;
    }
    const id = createDecision({
      title: title.trim(),
      question: question.trim(),
      category,
      timeHorizon: horizon,
      deadline: deadline ? new Date(deadline + 'T12:00:00').toISOString() : undefined,
    });
    setTitle('');
    setQuestion('');
    setDeadline('');
    setError('');
    onClose();
    nav(`/app/decision/${id}/canvas`);
  };

  return (
    <Modal open={open} onClose={onClose} title="New decision space" wide>
      <div className="space-y-4">
        <div>
          <Label hint="required">Title</Label>
          <Input
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="Laptop replacement"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {error && <p className="mt-1.5 text-[12px] font-medium text-[var(--coral)]">{error}</p>}
        </div>
        <div>
          <Label hint="the honest version">The question</Label>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Should I buy a new laptop — or squeeze another year out of the current one?"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Time horizon</Label>
            <Select value={horizon} onChange={(e) => setHorizon(e.target.value)}>
              {['< 6 months', '6–12 months', '1–3 years', '3–5 years', '5+ years'].map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label hint="optional">Deadline</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Create space <IcArrowUpRight size={14} /></Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------- signals ------------------------------- */

interface Signal {
  tone: 'teal' | 'amber' | 'coral' | 'blue';
  text: string;
  to: string;
}

function buildSignals(decisions: Decision[]): Signal[] {
  const out: Signal[] = [];
  for (const d of decisions) {
    if (d.status === 'decided') continue;
    const m = computeModel(d);
    if (d.deadline) {
      const dd = daysUntil(d.deadline);
      if (dd <= 3) {
        out.push({
          tone: 'coral',
          text: `“${d.title}” is ${dd < 0 ? `${Math.abs(dd)}d overdue` : dd === 0 ? 'due today' : `due in ${dd}d`} — ${m.winner?.option.name ?? 'no option'} leads by ${m.margin.toFixed(1)} pts.`,
          to: `/app/decision/${d.id}/analysis`,
        });
      }
    }
    if (m.confidence < 50 && d.options.length > 0) {
      out.push({
        tone: 'amber',
        text: `Confidence on “${d.title}” sits at ${m.confidence}%. One or two high-reliability evidence items would firm it up.`,
        to: `/app/decision/${d.id}/evidence`,
      });
    }
    if (m.margin < 4 && m.margin > 0 && d.options.length > 1) {
      out.push({
        tone: 'blue',
        text: `“${d.title}” is a coin-flip (${m.margin.toFixed(1)} pt gap). Run What-If to find which weight tips it.`,
        to: `/app/decision/${d.id}/whatif`,
      });
    }
    if (m.riskLevel === 'high') {
      out.push({
        tone: 'coral',
        text: `Risk load on “${d.title}” is high — the leading option carries a heavy penalty. Review mitigations.`,
        to: `/app/decision/${d.id}/risks`,
      });
    }
  }
  const decidedNoOutcome = decisions.find(
    (d) => d.status === 'decided' && !d.journal.some((j) => j.kind === 'outcome'),
  );
  if (decidedNoOutcome) {
    out.push({
      tone: 'teal',
      text: `“${decidedNoOutcome.title}” was decided ${timeAgo(decidedNoOutcome.updatedAt)}. Reality check time — log the outcome.`,
      to: `/app/decision/${decidedNoOutcome.id}/journal`,
    });
  }
  return out.slice(0, 5);
}

/* ------------------------------ dashboard ------------------------------ */

export function Dashboard() {
  const decisions = useStore((s) => s.decisions);
  const [params, setParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(params.get('new') === '1');
  const nav = useNavigate();

  useEffect(() => {
    if (params.get('new') === '1') setModalOpen(true);
  }, [params]);

  const close = () => {
    setModalOpen(false);
    if (params.get('new')) setParams({}, { replace: true });
  };

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const sorted = useMemo(
    () =>
      [...decisions].sort((a, b) => {
        const ad = a.status === 'decided' ? 1 : 0;
        const bd = b.status === 'decided' ? 1 : 0;
        if (ad !== bd) return ad - bd;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }),
    [decisions],
  );

  const stats = useMemo(() => {
    const active = decisions.filter((d) => d.status !== 'decided');
    const models = active.map((d) => computeModel(d));
    const avgConf = models.length
      ? Math.round(models.reduce((a, m) => a + m.confidence, 0) / models.length)
      : 0;
    const evidence = decisions.reduce((a, d) => a + d.evidence.length, 0);
    const decided = decisions.filter((d) => d.status === 'decided').length;
    const dueSoon = active.filter((d) => d.deadline && daysUntil(d.deadline) <= 7).length;
    return { active: active.length, avgConf, evidence, decided, dueSoon };
  }, [decisions]);

  const signals = useMemo(() => buildSignals(decisions), [decisions]);

  return (
    <div className="anim-fade-up">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-data text-[11px] uppercase tracking-widest text-[var(--faint)]">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-display mt-1 text-[clamp(24px,3.4vw,34px)] font-bold tracking-tight">
            {greeting}, Alex.
          </h1>
          <p className="mt-1 text-[14px] text-[var(--muted)]">
            {stats.active} active {stats.active === 1 ? 'space' : 'spaces'}
            {stats.dueSoon > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-[var(--coral)]">{stats.dueSoon} due this week</span>
              </>
            )}
            {' · '}model confidence averaging {stats.avgConf}%
          </p>
        </div>
        <Button size="lg" onClick={() => setModalOpen(true)}>
          <IcPlus size={15} /> New decision
        </Button>
      </div>

      {/* stats rail */}
      <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] sm:grid-cols-4 sm:divide-y-0">
        {[
          { v: String(stats.active), l: 'active spaces', c: 'var(--teal)' },
          { v: `${stats.avgConf}%`, l: 'avg confidence', c: 'var(--blue)' },
          { v: String(stats.evidence), l: 'evidence items', c: 'var(--amber)' },
          { v: String(stats.decided), l: 'decided', c: 'var(--ink)' },
        ].map((s) => (
          <div key={s.l} className="px-5 py-4">
            <p className="font-display text-[26px] font-bold leading-none" style={{ color: s.c }}>{s.v}</p>
            <p className="mt-1.5 font-data text-[10px] uppercase tracking-wider text-[var(--faint)]">{s.l}</p>
          </div>
        ))}
      </div>

      {/* main grid */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_330px]">
        {/* decision list */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold">Decision spaces</h2>
            <span className="font-data text-[11px] text-[var(--faint)]">sorted by activity</span>
          </div>

          {sorted.length === 0 ? (
            <EmptyState
              icon={<IcTarget size={20} />}
              title="No decision spaces yet"
              body="Every big choice you're circling deserves a model. Start with the one you've been postponing the longest."
              action={<Button onClick={() => setModalOpen(true)}><IcPlus size={14} /> Create your first space</Button>}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
              {sorted.map((d, i) => (
                <DecisionRow key={d.id} d={d} isLast={i === sorted.length - 1} />
              ))}
            </div>
          )}
        </section>

        {/* right rail */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <h2 className="font-display flex items-center gap-2 text-[14px] font-semibold">
              <IcSpark size={15} className="text-[var(--teal)]" /> Signals
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--muted)]">Computed live from your models.</p>
            <div className="mt-3 space-y-2.5">
              {signals.length === 0 && (
                <p className="rounded-xl bg-[var(--sunken)] px-3 py-4 text-center text-[12.5px] text-[var(--muted)]">
                  All quiet — your models are healthy.
                </p>
              )}
              {signals.map((s, i) => (
                <button
                  key={i}
                  onClick={() => nav(s.to)}
                  className={cn(
                    'group w-full rounded-xl border-l-[3px] bg-[var(--sunken)]/60 px-3 py-2.5 text-left transition-all duration-150 hover:translate-x-0.5 hover:bg-[var(--sunken)] cursor-pointer',
                    s.tone === 'coral' && 'border-[var(--coral)]',
                    s.tone === 'amber' && 'border-[var(--amber)]',
                    s.tone === 'blue' && 'border-[var(--blue)]',
                    s.tone === 'teal' && 'border-[var(--teal)]',
                  )}
                >
                  <p className="text-[12.5px] leading-relaxed text-[var(--ink)]">{s.text}</p>
                  <span className="mt-1 flex items-center gap-1 font-data text-[10.5px] text-[var(--teal)] opacity-0 transition-opacity group-hover:opacity-100">
                    open <IcArrowUpRight size={11} />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <h2 className="font-display text-[14px] font-semibold">Recently updated</h2>
            <ul className="mt-3 space-y-1">
              {sorted.slice(0, 4).map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => nav(`/app/decision/${d.id}/canvas`)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--sunken)] cursor-pointer"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{d.title}</span>
                    <span className="font-data text-[10.5px] text-[var(--faint)]">{timeAgo(d.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-dashed border-[var(--line-strong)] p-4">
            <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">decision hygiene</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
              A model with no contradicting evidence is a wish. Before you commit, hunt for the strongest argument
              against your leader.
            </p>
          </section>
        </aside>
      </div>

      <NewDecisionModal open={modalOpen} onClose={close} />
    </div>
  );
}

/* ----------------------------- decision row ---------------------------- */

function DecisionRow({ d, isLast }: { d: Decision; isLast: boolean }) {
  const nav = useNavigate();
  const model = useMemo(() => computeModel(d), [d]);
  const dd = d.deadline ? daysUntil(d.deadline) : null;
  const urgent = dd !== null && dd <= 7 && d.status !== 'decided';
  const dueLabel = dd !== null && (dd < 0 ? 'overdue' : dd === 0 ? 'due today' : `${dd}d left`);

  return (
    <button
      onClick={() => nav(`/app/decision/${d.id}/canvas`)}
      className={cn(
        'group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-[var(--sunken)]/70 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_auto] cursor-pointer',
        !isLast && 'border-b border-[var(--line)]',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <StatusPill status={d.status} />
          <Badge tone="neutral" className="capitalize">{d.category}</Badge>
          {urgent && dueLabel && (
            <Badge tone={dd !== null && dd <= 3 ? 'coral' : 'amber'}>{dueLabel}</Badge>
          )}
        </div>
        <h3 className="mt-1.5 truncate font-display text-[15px] font-semibold group-hover:text-[var(--teal)] transition-colors">
          {d.title}
        </h3>
        <p className="mt-0.5 truncate text-[12.5px] text-[var(--muted)]">{d.question}</p>
      </div>

      {model.rows.length > 0 ? (
        <div className="hidden sm:block">
          <p className="mb-1 font-data text-[10px] uppercase tracking-wider text-[var(--faint)]">
            leading: <span className="text-[var(--ink)]">{model.winner?.option.name}</span>
          </p>
          <div className="space-y-1">
            {model.rows.slice(0, 3).map((r) => (
              <div key={r.option.id} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.option.color }} />
                <div className="h-1.5 w-full max-w-36 overflow-hidden rounded-full bg-[var(--sunken)]">
                  <div className="bar-anim h-full rounded-full" style={{ width: `${r.adjusted}%`, background: r.option.color }} />
                </div>
                <span className="font-data text-[10px] text-[var(--faint)]">{r.adjusted.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="hidden items-center gap-1.5 text-[12px] text-[var(--faint)] sm:flex">
          <IcCompass size={14} /> no options yet
        </div>
      )}

      <div className="hidden sm:block">
        <div className="flex items-baseline justify-between">
          <span className="font-data text-[10px] uppercase tracking-wider text-[var(--faint)]">confidence</span>
          <span className="font-data text-[12px] font-semibold">{model.confidence}%</span>
        </div>
        <Meter
          value={model.confidence}
          className="mt-1.5"
          color={model.confidence >= 66 ? 'var(--teal)' : model.confidence >= 40 ? 'var(--amber)' : 'var(--coral)'}
        />
        <p className="mt-1 font-data text-[10px] text-[var(--faint)]">updated {timeAgo(d.updatedAt)}</p>
      </div>

      <IcChevronRight size={16} className="hidden text-[var(--faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--teal)] sm:block" />

      <span className="col-span-2 flex items-center gap-3 sm:hidden">
        <Meter value={model.confidence} className="flex-1" />
        <span className="font-data text-[11px] text-[var(--faint)]">{timeAgo(d.updatedAt)}</span>
      </span>
    </button>
  );
}
