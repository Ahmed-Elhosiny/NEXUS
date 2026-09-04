import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDecision, useStore } from '../../store';
import {
  cn,
  computeModel,
  daysUntil,
  fmtDate,
  nextOptionColor,
  normalizedWeights,
  OPTION_PALETTE,
  timeAgo,
  type ModelResult,
} from '../../lib/engine';
import {
  Badge,
  Button,
  Confirm,
  EmptyState,
  IconBtn,
  Input,
  Label,
  Menu,
  Meter,
  RangeSlider,
  Select,
  Skeleton,
  StatusPill,
  Tabs,
  Textarea,
} from '../../components/ui';
import { RiskMatrix } from '../../components/charts';
import {
  IcArrowLeft,
  IcBook,
  IcChart,
  IcCheck,
  IcChevronDown,
  IcChevronUp,
  IcClock,
  IcCompass,
  IcDoc,
  IcDots,
  IcFlag,
  IcGrip,
  IcHistory,
  IcLayers,
  IcLink,
  IcPlus,
  IcScale,
  IcShield,
  IcSliders,
  IcSpark,
  IcTarget,
  IcTrash,
  IcX,
} from '../../components/icons';
import type { Category, Decision, DecisionStatus } from '../../types';
import { EvidenceTab, JournalTab, RisksTab, TimelineTab } from './Extras';

const Analysis = lazy(() => import('./Analysis'));
const WhatIf = lazy(() => import('./WhatIf'));
const Scenarios = lazy(() => import('./Scenarios'));

type Tab = 'canvas' | 'analysis' | 'whatif' | 'scenarios' | 'evidence' | 'risks' | 'timeline' | 'journal';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'canvas', label: 'Canvas', icon: <IcTarget size={14} /> },
  { id: 'analysis', label: 'Analysis', icon: <IcChart size={14} /> },
  { id: 'whatif', label: 'What-If', icon: <IcSliders size={14} /> },
  { id: 'scenarios', label: 'Scenarios', icon: <IcLayers size={14} /> },
  { id: 'evidence', label: 'Evidence', icon: <IcDoc size={14} /> },
  { id: 'risks', label: 'Risks', icon: <IcShield size={14} /> },
  { id: 'timeline', label: 'Timeline', icon: <IcHistory size={14} /> },
  { id: 'journal', label: 'Journal', icon: <IcBook size={14} /> },
];

type Sel = { kind: 'decision' } | { kind: 'option'; id: string } | { kind: 'criterion'; id: string };

const TabFallback = () => (
  <div className="space-y-4" role="status" aria-label="Loading tab">
    <Skeleton className="h-24" />
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  </div>
);

/* ================================ main ================================= */

export function DecisionSpace() {
  const { id, tab } = useParams<{ id: string; tab: string }>();
  const nav = useNavigate();
  const d = useDecision(id);
  const [params, setParams] = useSearchParams();
  const [sel, setSel] = useState<Sel>({ kind: 'decision' });
  const [drawer, setDrawer] = useState(false);
  const [addOpt, setAddOpt] = useState(false);
  const [addCrit, setAddCrit] = useState(false);

  const model = useMemo(() => (d ? computeModel(d) : null), [d]);

  useEffect(() => {
    const add = params.get('add');
    if (add === 'option') setAddOpt(true);
    if (add === 'criterion') setAddCrit(true);
    if (add) setParams({}, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    // keep selection valid
    if (!d) return;
    if (sel.kind === 'option' && !d.options.some((o) => o.id === sel.id)) setSel({ kind: 'decision' });
    if (sel.kind === 'criterion' && !d.criteria.some((c) => c.id === sel.id)) setSel({ kind: 'decision' });
  }, [d, sel]);

  useEffect(() => {
    if (!drawer) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [drawer]);

  if (!d || !model) {
    return (
      <EmptyState
        icon={<IcCompass size={20} />}
        title="Decision space not found"
        body="It may have been deleted. Head back to the dashboard and pick another — or start fresh."
        action={
          <Link to="/app">
            <Button variant="outline"><IcArrowLeft size={14} /> Back to dashboard</Button>
          </Link>
        }
      />
    );
  }

  const activeTab: Tab = (TABS.some((t) => t.id === tab) ? tab : 'canvas') as Tab;
  const select = (s: Sel) => {
    setSel(s);
    if (window.innerWidth < 1280) setDrawer(true);
  };

  return (
    <div className="anim-fade-up">
      {/* header */}
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <Link to="/app" className="mt-1 hidden sm:block">
          <IconBtn label="Back to dashboard"><IcArrowLeft size={16} /></IconBtn>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={d.status} />
            <Badge tone="neutral" className="capitalize">{d.category}</Badge>
            {d.deadline && d.status !== 'decided' && (
              <Badge tone={daysUntil(d.deadline) <= 3 ? 'coral' : 'amber'}>
                <IcClock size={11} /> {daysUntil(d.deadline) < 0 ? 'overdue' : `${daysUntil(d.deadline)}d left`} · {fmtDate(d.deadline)}
              </Badge>
            )}
            <Badge tone="neutral"><IcHistory size={11} /> {d.timeHorizon}</Badge>
            <span className="font-data text-[11px] text-[var(--faint)]">updated {timeAgo(d.updatedAt)}</span>
          </div>
          <h1 className="font-display mt-1.5 text-[clamp(20px,2.6vw,27px)] font-bold leading-tight tracking-tight">
            {d.question}
          </h1>
        </div>
        <SpaceMenu d={d} />
      </div>

      <div className="mb-5">
        <Tabs items={TABS} active={activeTab} onChange={(t) => nav(`/app/decision/${d.id}/${t}`)} />
      </div>

      {activeTab === 'canvas' ? (
        <div className="grid gap-5 xl:grid-cols-[200px_minmax(0,1fr)_290px]">
          <StructureRail d={d} model={model} sel={sel} select={(s) => select(s)} onAddOption={() => setAddOpt(true)} onAddCriterion={() => setAddCrit(true)} />

          <div className="min-w-0">
            <Canvas
              d={d}
              model={model}
              sel={sel}
              select={select}
              addOpt={addOpt}
              setAddOpt={setAddOpt}
              addCrit={addCrit}
              setAddCrit={setAddCrit}
            />
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-[72px] max-h-[calc(100vh-90px)] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
              <Inspector d={d} model={model} sel={sel} />
            </div>
          </aside>

          {/* mobile / tablet inspector drawer */}
          {drawer && (
            <div className="fixed inset-0 z-[80] xl:hidden">
              <div className="absolute inset-0 bg-black/45" onClick={() => setDrawer(false)} />
              <div className="absolute inset-y-0 right-0 flex w-[min(92vw,340px)] flex-col overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)] anim-fade-up">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-4 py-2.5">
                  <p className="font-data text-[11px] uppercase tracking-widest text-[var(--faint)]">Inspector</p>
                  <IconBtn label="Close inspector" onClick={() => setDrawer(false)}><IcX size={15} /></IconBtn>
                </div>
                <Inspector d={d} model={model} sel={sel} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Suspense fallback={<TabFallback />} key={d.id}>
          {activeTab === 'analysis' && <Analysis key={d.id} d={d} model={model} />}
          {activeTab === 'whatif' && <WhatIf key={d.id} d={d} model={model} />}
          {activeTab === 'scenarios' && <Scenarios key={d.id} d={d} model={model} />}
          {activeTab === 'evidence' && <EvidenceTab key={d.id} d={d} />}
          {activeTab === 'risks' && <RisksTab key={d.id} d={d} />}
          {activeTab === 'timeline' && <TimelineTab key={d.id} d={d} />}
          {activeTab === 'journal' && <JournalTab key={d.id} d={d} />}
        </Suspense>
      )}
    </div>
  );
}

function SpaceMenu({ d }: { d: Decision }) {
  const nav = useNavigate();
  const deleteDecision = useStore((s) => s.deleteDecision);
  const setStatus = useStore((s) => s.setStatus);
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <>
      <Menu
        trigger={
          <IconBtn label="Space menu" className="border border-[var(--line)] bg-[var(--surface)]"><IcDots size={16} /></IconBtn>
        }
        items={[
          ...(d.status !== 'decided'
            ? [{ label: 'Mark as decided', icon: <IcFlag size={14} />, onClick: () => setStatus(d.id, 'decided') }]
            : [{ label: 'Reopen decision', icon: <IcCompass size={14} />, onClick: () => setStatus(d.id, 'reviewing') }]),
          { label: 'Open analysis', icon: <IcChart size={14} />, onClick: () => nav(`/app/decision/${d.id}/analysis`) },
          { label: 'Delete space', icon: <IcTrash size={14} />, danger: true, onClick: () => setConfirmDel(true) },
        ]}
      />
      <Confirm
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={() => {
          deleteDecision(d.id);
          nav('/app');
        }}
        title="Delete this decision space?"
        body={`“${d.title}” and all of its options, evidence, risks and journal entries will be permanently removed.`}
      />
    </>
  );
}

/* ============================ structure rail ============================ */

function StructureRail({
  d, model, sel, select, onAddOption, onAddCriterion,
}: {
  d: Decision;
  model: ModelResult;
  sel: Sel;
  select: (s: Sel) => void;
  onAddOption: () => void;
  onAddCriterion: () => void;
}) {
  const nav = useNavigate();
  const weights = normalizedWeights(d.criteria);
  const scoreOf = (oid: string) => model.rows.find((r) => r.option.id === oid)?.adjusted;

  return (
    <nav className="hidden xl:block" aria-label="Decision structure">
      <div className="sticky top-[72px] space-y-4">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
          <p className="px-1 font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">Structure</p>
          <button
            onClick={() => select({ kind: 'decision' })}
            className={cn(
              'mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors cursor-pointer',
              sel.kind === 'decision' ? 'bg-[var(--teal-soft)] text-[var(--teal)]' : 'text-[var(--muted)] hover:bg-[var(--sunken)]',
            )}
          >
            <IcTarget size={14} /> Decision
          </button>

          <div className="mt-2 flex items-center justify-between px-1">
            <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">Options</p>
            <IconBtn label="Add option" className="h-6 w-6" onClick={onAddOption}><IcPlus size={13} /></IconBtn>
          </div>
          {d.options.map((o) => (
            <button
              key={o.id}
              onClick={() => select({ kind: 'option', id: o.id })}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors cursor-pointer',
                sel.kind === 'option' && sel.id === o.id ? 'bg-[var(--sunken)] font-semibold' : 'text-[var(--muted)] hover:bg-[var(--sunken)]',
                o.eliminated && 'opacity-45 line-through',
              )}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.color }} />
              <span className="min-w-0 flex-1 truncate text-left">{o.name}</span>
              {scoreOf(o.id) !== undefined && (
                <span className="font-data text-[10.5px] text-[var(--faint)]">{scoreOf(o.id)!.toFixed(0)}</span>
              )}
            </button>
          ))}

          <div className="mt-2 flex items-center justify-between px-1">
            <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">Criteria</p>
            <IconBtn label="Add criterion" className="h-6 w-6" onClick={onAddCriterion}><IcPlus size={13} /></IconBtn>
          </div>
          {d.criteria.map((c) => (
            <button
              key={c.id}
              onClick={() => select({ kind: 'criterion', id: c.id })}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors cursor-pointer',
                sel.kind === 'criterion' && sel.id === c.id ? 'bg-[var(--sunken)] font-semibold' : 'text-[var(--muted)] hover:bg-[var(--sunken)]',
              )}
            >
              <IcScale size={13} className="shrink-0 text-[var(--faint)]" />
              <span className="min-w-0 flex-1 truncate text-left">{c.name}</span>
              <span className="font-data text-[10.5px] text-[var(--faint)]">{Math.round((weights[c.id] ?? 0) * 100)}%</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
          {[
            { n: d.evidence.length, l: 'Evidence', to: 'evidence', icon: <IcDoc size={13} /> },
            { n: d.risks.length, l: 'Risks', to: 'risks', icon: <IcShield size={13} /> },
            { n: d.scenarios.length, l: 'Scenarios', to: 'scenarios', icon: <IcLayers size={13} /> },
            { n: d.journal.length, l: 'Journal', to: 'journal', icon: <IcBook size={13} /> },
          ].map((x) => (
            <button
              key={x.to}
              onClick={() => nav(`/app/decision/${d.id}/${x.to}`)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[var(--muted)] transition-colors hover:bg-[var(--sunken)] hover:text-[var(--ink)] cursor-pointer"
            >
              {x.icon}
              <span className="flex-1 text-left">{x.l}</span>
              <Badge tone="neutral">{x.n}</Badge>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
          <div className="flex items-baseline justify-between px-1">
            <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">Confidence</p>
            <p className="font-data text-[13px] font-semibold text-[var(--teal)]">{model.confidence}%</p>
          </div>
          <Meter value={model.confidence} className="mt-2" color={model.confidence >= 66 ? 'var(--teal)' : model.confidence >= 40 ? 'var(--amber)' : 'var(--coral)'} />
        </div>
      </div>
    </nav>
  );
}

/* ================================ canvas ================================ */

function NodeFrame({ n, title, right, children }: { n: string; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="font-data text-[11px] font-semibold text-[var(--teal)]">{n}</span>
        <h2 className="font-display text-[14.5px] font-semibold">{title}</h2>
        <div className="ml-auto">{right}</div>
      </div>
      {children}
    </section>
  );
}

const Spine = () => (
  <div className="flex justify-center py-1.5" aria-hidden="true">
    <div className="spine h-8" />
  </div>
);

function Canvas({
  d, model, sel, select, addOpt, setAddOpt, addCrit, setAddCrit,
}: {
  d: Decision;
  model: ModelResult;
  sel: Sel;
  select: (s: Sel) => void;
  addOpt: boolean;
  setAddOpt: (v: boolean) => void;
  addCrit: boolean;
  setAddCrit: (v: boolean) => void;
}) {
  const nav = useNavigate();
  const weights = normalizedWeights(d.criteria);
  const rowOf = (oid: string) => model.rows.find((r) => r.option.id === oid);

  return (
    <div>
      {/* 01 — decision */}
      <NodeFrame n="01" title="Decision">
        <button
          onClick={() => select({ kind: 'decision' })}
          className={cn(
            'w-full rounded-2xl border bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] cursor-pointer',
            sel.kind === 'decision' ? 'border-[var(--teal)] ring-2 ring-[var(--ring)]' : 'border-[var(--line)]',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" className="capitalize"><IcLink size={11} /> {d.dependencies.length} dependencies</Badge>
            <Badge tone="neutral">{d.expectedOutcomes.length} expected outcomes</Badge>
            {model.winner && (
              <Badge tone="teal" className="ml-auto">
                leading · {model.winner.option.name} · {model.winner.adjusted.toFixed(1)}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--muted)]">
            {d.title} — framed {timeAgo(d.createdAt)}. Select this node to edit the question, horizon, confidence and dependencies in the inspector.
          </p>
        </button>
      </NodeFrame>

      <Spine />

      {/* 02 — options */}
      <NodeFrame
        n="02"
        title={`Options · ${d.options.length}`}
        right={<Button size="sm" variant="soft" onClick={() => setAddOpt(true)}><IcPlus size={13} /> Option</Button>}
      >
        {d.options.length === 0 && !addOpt && (
          <EmptyState
            icon={<IcCompass size={19} />}
            title="No paths on the table"
            body="Add at least two options — including “do nothing” — so the model has something to weigh."
            action={<Button onClick={() => setAddOpt(true)}><IcPlus size={14} /> Add first option</Button>}
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {d.options.map((o) => {
            const row = rowOf(o.id);
            const isSel = sel.kind === 'option' && sel.id === o.id;
            return (
              <div
                key={o.id}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
                  isSel ? 'border-[var(--teal)] ring-2 ring-[var(--ring)]' : 'border-[var(--line)]',
                  o.eliminated && 'opacity-55',
                )}
              >
                <div className="h-1" style={{ background: o.color }} />
                <button onClick={() => select({ kind: 'option', id: o.id })} className="block w-full p-3.5 text-left cursor-pointer">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: o.color }} />
                    <div className="min-w-0 flex-1">
                      <h3 className={cn('truncate font-display text-[14px] font-semibold', o.eliminated && 'line-through')}>{o.name}</h3>
                      {o.description && <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--muted)]">{o.description}</p>}
                    </div>
                    {row && (
                      <Badge tone={row.rank === 1 ? 'teal' : 'neutral'}>#{row.rank}</Badge>
                    )}
                    {o.eliminated && <Badge tone="coral">out</Badge>}
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="font-data text-[22px] font-semibold leading-none" style={{ color: o.color }}>
                        {row ? row.adjusted.toFixed(1) : '—'}
                      </p>
                      <p className="mt-1 font-data text-[10px] text-[var(--faint)]">
                        {row ? `raw ${row.raw.toFixed(1)} · risk −${row.penalty.toFixed(1)}` : 'eliminated'}
                      </p>
                    </div>
                    {row && row.strengths[0] && (
                      <span className="rounded-md bg-[var(--sunken)] px-1.5 py-0.5 font-data text-[10px] text-[var(--muted)]">
                        strong: {row.strengths[0].criterion.name}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center justify-between border-t border-[var(--line)] px-3 py-1.5">
                  <span className="flex gap-2 font-data text-[10.5px] text-[var(--faint)]">
                    <span className="flex items-center gap-1"><IcDoc size={11} /> {d.evidence.filter((e) => e.optionId === o.id).length}</span>
                    <span className="flex items-center gap-1"><IcShield size={11} /> {d.risks.filter((r) => r.optionId === o.id).length}</span>
                    {o.cost !== undefined && <span>${o.cost.toLocaleString()}</span>}
                  </span>
                  <OptionMenu d={d} optionId={o.id} onSelect={() => select({ kind: 'option', id: o.id })} />
                </div>
              </div>
            );
          })}
          {addOpt && <AddOptionForm d={d} onDone={() => setAddOpt(false)} />}
        </div>
      </NodeFrame>

      <Spine />

      {/* 03 — criteria matrix */}
      <NodeFrame
        n="03"
        title={`Criteria & scores · ${d.criteria.length}`}
        right={
          <div className="flex items-center gap-2">
            <span className="hidden font-data text-[10.5px] text-[var(--faint)] sm:block">weights auto-normalize</span>
            <Button size="sm" variant="soft" onClick={() => setAddCrit(true)}><IcPlus size={13} /> Criterion</Button>
          </div>
        }
      >
        {d.criteria.length === 0 && !addCrit && (
          <EmptyState
            icon={<IcScale size={19} />}
            title="Nothing to weigh against"
            body="Add the criteria that actually matter — price, battery, growth, peace of mind — then set their weights."
            action={<Button onClick={() => setAddCrit(true)}><IcPlus size={14} /> Add first criterion</Button>}
          />
        )}
        {d.criteria.length > 0 && d.options.length > 0 && (
          <CriteriaMatrix d={d} weights={weights} sel={sel} select={select} addCrit={addCrit} setAddCrit={setAddCrit} />
        )}
        {(d.criteria.length === 0 || d.options.length === 0) && addCrit && (
          <AddCriterionForm d={d} onDone={() => setAddCrit(false)} />
        )}
      </NodeFrame>

      <Spine />

      {/* 04 — evidence & risk */}
      <NodeFrame n="04" title="Evidence & risk">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <h3 className="font-display flex items-center gap-2 text-[13.5px] font-semibold"><IcDoc size={14} className="text-[var(--teal)]" /> Evidence</h3>
              <button onClick={() => nav(`/app/decision/${d.id}/evidence`)} className="font-data text-[11px] text-[var(--teal)] hover:underline cursor-pointer">manage →</button>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              <Badge tone="teal">{d.evidence.filter((e) => e.stance === 'supporting').length} supporting</Badge>
              <Badge tone="coral">{d.evidence.filter((e) => e.stance === 'contradicting').length} contradicting</Badge>
              <Badge tone="neutral">{d.evidence.filter((e) => e.stance === 'neutral').length} neutral</Badge>
            </div>
            {d.evidence.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-[var(--muted)]">No evidence yet — the model is running on assumptions.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {d.evidence.slice(0, 3).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="truncate">{e.title}</span>
                    <Badge tone={e.stance === 'supporting' ? 'teal' : e.stance === 'contradicting' ? 'coral' : 'neutral'}>{e.stance}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <h3 className="font-display flex items-center gap-2 text-[13.5px] font-semibold"><IcShield size={14} className="text-[var(--coral)]" /> Risk</h3>
              <button onClick={() => nav(`/app/decision/${d.id}/risks`)} className="font-data text-[11px] text-[var(--teal)] hover:underline cursor-pointer">manage →</button>
            </div>
            {d.risks.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-[var(--muted)]">No risks mapped — optimistic, possibly dangerous.</p>
            ) : (
              <>
                <div className="mt-2.5">
                  <RiskMatrix
                    risks={d.risks}
                    compact
                    colorFor={(oid) => d.options.find((o) => o.id === oid)?.color ?? 'var(--coral)'}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </NodeFrame>

      <Spine />

      {/* 05 — outcome */}
      <NodeFrame n="05" title="Outcome">
        <OutcomeNode d={d} model={model} onAnalyze={() => nav(`/app/decision/${d.id}/analysis`)} />
      </NodeFrame>
    </div>
  );
}

function OutcomeNode({ d, model, onAnalyze }: { d: Decision; model: ModelResult; onAnalyze: () => void }) {
  const setStatus = useStore((s) => s.setStatus);
  if (d.options.length === 0 || d.criteria.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)]/60 p-5 text-center">
        <p className="text-[13.5px] text-[var(--muted)]">The outcome appears once the model has at least one option and one criterion.</p>
      </div>
    );
  }
  const w = model.winner!;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${w.option.color}22`, color: w.option.color }}>
            <IcFlag size={22} />
          </span>
          <div>
            <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">
              {d.status === 'decided' ? 'decision recorded' : 'model recommendation'}
            </p>
            <p className="font-display text-[20px] font-bold leading-tight">{w.option.name}</p>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              {model.runnerUp
                ? `leads ${model.runnerUp.option.name} by ${model.margin.toFixed(1)} pts under your current weights`
                : 'only live option'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Badge tone="teal">score {w.adjusted.toFixed(1)}</Badge>
          <Badge tone={model.confidence >= 66 ? 'teal' : model.confidence >= 40 ? 'amber' : 'coral'}>confidence {model.confidence}%</Badge>
          <Badge tone={model.riskLevel === 'high' ? 'coral' : model.riskLevel === 'medium' ? 'amber' : 'teal'}>risk {model.riskLevel}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[var(--line)] bg-[var(--sunken)]/50 px-5 py-3">
        <Button size="sm" onClick={onAnalyze}><IcChart size={13} /> Open full analysis</Button>
        {d.status !== 'decided' && (
          <Button size="sm" variant="outline" onClick={() => setStatus(d.id, 'decided')}>
            <IcCheck size={13} /> Mark decided
          </Button>
        )}
        <span className="ml-auto hidden items-center gap-1.5 self-center font-data text-[10.5px] text-[var(--faint)] sm:flex">
          <IcSpark size={12} /> recomputes live with every edit
        </span>
      </div>
    </div>
  );
}

/* --------------------------- add/option forms --------------------------- */

function AddOptionForm({ d, onDone }: { d: Decision; onDone: () => void }) {
  const addOption = useStore((s) => s.addOption);
  const toast = useStore((s) => s.toast);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (!name.trim()) {
      setErr(true);
      return;
    }
    addOption(d.id, name.trim(), desc.trim() || undefined);
    toast(`Option “${name.trim()}” added — score it against your criteria`);
    onDone();
  };
  return (
    <div className="anim-pop flex flex-col justify-between rounded-2xl border-2 border-dashed border-[var(--teal)] bg-[var(--teal-soft)]/30 p-3.5">
      <div>
        <Label>New option</Label>
        <Input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="e.g. Buy refurbished"
        />
        {err && <p className="mt-1 text-[11.5px] font-medium text-[var(--coral)]">A name is required.</p>}
        <Input className="mt-2" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="One-line description (optional)" />
        <p className="mt-2 flex items-center gap-1.5 font-data text-[10.5px] text-[var(--faint)]">
          color <span className="h-2.5 w-2.5 rounded-full" style={{ background: nextOptionColor(d) }} /> auto-assigned · scores start at 5/10
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={submit}><IcPlus size={13} /> Add</Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

function AddCriterionForm({ d, onDone }: { d: Decision; onDone: () => void }) {
  const addCriterion = useStore((s) => s.addCriterion);
  const toast = useStore((s) => s.toast);
  const [name, setName] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (!name.trim()) {
      setErr(true);
      return;
    }
    addCriterion(d.id, name.trim(), 10);
    toast(`Criterion “${name.trim()}” added at even weight`);
    onDone();
  };
  return (
    <div className="anim-pop rounded-2xl border-2 border-dashed border-[var(--teal)] bg-[var(--teal-soft)]/30 p-3.5">
      <Label>New criterion</Label>
      <div className="flex gap-2">
        <Input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="e.g. Resale value"
        />
        <Button size="sm" className="h-9" onClick={submit}><IcPlus size={13} /> Add</Button>
        <Button size="sm" variant="ghost" className="h-9" onClick={onDone}>Cancel</Button>
      </div>
      {err && <p className="mt-1 text-[11.5px] font-medium text-[var(--coral)]">A name is required.</p>}
    </div>
  );
}

function OptionMenu({ d, optionId, onSelect }: { d: Decision; optionId: string; onSelect: () => void }) {
  const moveOption = useStore((s) => s.moveOption);
  const updateOption = useStore((s) => s.updateOption);
  const removeOption = useStore((s) => s.removeOption);
  const [confirm, setConfirm] = useState(false);
  const o = d.options.find((x) => x.id === optionId);
  if (!o) return null;
  const idx = d.options.indexOf(o);
  return (
    <>
      <div onClick={(e) => e.stopPropagation()}>
        <Menu
          trigger={<IconBtn label={`Options for ${o.name}`} className="h-6 w-6"><IcDots size={13} /></IconBtn>}
          items={[
            ...(idx > 0 ? [{ label: 'Move up', icon: <IcChevronUp size={14} />, onClick: () => moveOption(d.id, o.id, -1) }] : []),
            ...(idx < d.options.length - 1 ? [{ label: 'Move down', icon: <IcChevronDown size={14} />, onClick: () => moveOption(d.id, o.id, 1) }] : []),
            {
              label: o.eliminated ? 'Restore option' : 'Eliminate option',
              icon: o.eliminated ? <IcCompass size={14} /> : <IcX size={14} />,
              onClick: () => updateOption(d.id, o.id, { eliminated: !o.eliminated }),
            },
            { label: 'Inspect', icon: <IcGrip size={14} />, onClick: onSelect },
            { label: 'Remove', icon: <IcTrash size={14} />, danger: true, onClick: () => setConfirm(true) },
          ]}
        />
      </div>
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => removeOption(d.id, o.id)}
        title={`Remove “${o.name}”?`}
        body="The option, its scores and any evidence or risks attached to it will be removed from the model."
        confirmLabel="Remove option"
      />
    </>
  );
}

/* ============================ criteria matrix =========================== */

function CriteriaMatrix({
  d, weights, sel, select, addCrit, setAddCrit,
}: {
  d: Decision;
  weights: Record<string, number>;
  sel: Sel;
  select: (s: Sel) => void;
  addCrit: boolean;
  setAddCrit: (v: boolean) => void;
}) {
  const updateCriterion = useStore((s) => s.updateCriterion);
  const setScore = useStore((s) => s.setScore);
  const moveCriterion = useStore((s) => s.moveCriterion);
  const removeCriterion = useStore((s) => s.removeCriterion);
  const [confirmCrit, setConfirmCrit] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--sunken)]/60">
              <th className="w-[210px] px-3 py-2.5 text-left font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">criterion</th>
              <th className="w-[190px] px-2 py-2.5 text-left font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">weight</th>
              {d.options.map((o) => (
                <th key={o.id} className="min-w-[150px] px-2 py-2.5 text-left">
                  <span className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: o.color }} />
                    <span className="max-w-28 truncate">{o.name}</span>
                  </span>
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {d.criteria.map((c, ci) => {
              const isSel = sel.kind === 'criterion' && sel.id === c.id;
              return (
                <tr key={c.id} className={cn('border-b border-[var(--line)] transition-colors last:border-0', isSel ? 'bg-[var(--teal-soft)]/40' : 'hover:bg-[var(--sunken)]/50')}>
                  <td className="px-3 py-2.5">
                    <button onClick={() => select({ kind: 'criterion', id: c.id })} className="text-left cursor-pointer">
                      <span className="block font-semibold leading-tight hover:text-[var(--teal)] transition-colors">{c.name}</span>
                      <span className="font-data text-[10px] text-[var(--faint)]">{Math.round((weights[c.id] ?? 0) * 100)}% of model</span>
                    </button>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <RangeSlider value={c.weight} min={0} max={40} ariaLabel={`${c.name} weight`} onChange={(v) => updateCriterion(d.id, c.id, { weight: v })} />
                      </div>
                      <span className="font-data w-7 text-[11.5px] font-semibold text-[var(--teal)]">{c.weight}</span>
                    </div>
                  </td>
                  {d.options.map((o) => (
                    <td key={o.id} className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <RangeSlider
                            value={o.scores[c.id] ?? 5}
                            min={0}
                            max={10}
                            ariaLabel={`${o.name} score for ${c.name}`}
                            onChange={(v) => setScore(d.id, o.id, c.id, v)}
                          />
                        </div>
                        <span className="font-data w-5 text-[11.5px] text-[var(--muted)]">{o.scores[c.id] ?? 5}</span>
                      </div>
                    </td>
                  ))}
                  <td className="px-1 py-2.5">
                    <div className="flex items-center">
                      <IconBtn label="Move criterion up" className="h-6 w-6" onClick={() => moveCriterion(d.id, c.id, -1)} disabled={ci === 0}><IcChevronUp size={12} /></IconBtn>
                      <IconBtn label="Move criterion down" className="h-6 w-6" onClick={() => moveCriterion(d.id, c.id, 1)} disabled={ci === d.criteria.length - 1}><IcChevronDown size={12} /></IconBtn>
                      <IconBtn label={`Remove ${c.name}`} className="h-6 w-6 hover:text-[var(--coral)]" onClick={() => setConfirmCrit(c.id)}><IcTrash size={12} /></IconBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {addCrit && (
        <div className="border-t border-[var(--line)] p-3">
          <AddCriterionForm d={d} onDone={() => setAddCrit(false)} />
        </div>
      )}
      <Confirm
        open={confirmCrit !== null}
        onClose={() => setConfirmCrit(null)}
        onConfirm={() => confirmCrit && removeCriterion(d.id, confirmCrit)}
        title="Remove this criterion?"
        body="Its weight and all option scores for it will be dropped, and the model will re-normalize the remaining weights."
        confirmLabel="Remove criterion"
      />
    </div>
  );
}

/* ============================== inspector =============================== */

function Inspector({ d, model, sel }: { d: Decision; model: ModelResult; sel: Sel }) {
  if (sel.kind === 'option') {
    const o = d.options.find((x) => x.id === sel.id);
    if (o) return <OptionInspector d={d} optionId={o.id} model={model} />;
  }
  if (sel.kind === 'criterion') {
    const c = d.criteria.find((x) => x.id === sel.id);
    if (c) return <CriterionInspector d={d} criterionId={c.id} />;
  }
  return <DecisionInspector d={d} />;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      {children}
    </div>
  );
}

function DecisionInspector({ d }: { d: Decision }) {
  const updateDecision = useStore((s) => s.updateDecision);
  const setStatus = useStore((s) => s.setStatus);
  const toast = useStore((s) => s.toast);
  const [dep, setDep] = useState('');
  const [out, setOut] = useState('');

  const addDep = () => {
    if (!dep.trim()) return;
    updateDecision(d.id, { dependencies: [...d.dependencies, dep.trim()] });
    setDep('');
  };
  const addOut = () => {
    if (!out.trim()) return;
    updateDecision(d.id, { expectedOutcomes: [...d.expectedOutcomes, out.trim()] });
    setOut('');
  };

  return (
    <div className="space-y-4 p-4">
      <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">Decision</p>
      <Field label="Title">
        <Input value={d.title} onChange={(e) => updateDecision(d.id, { title: e.target.value })} />
      </Field>
      <Field label="Question" hint="frame it honestly">
        <Textarea value={d.question} onChange={(e) => updateDecision(d.id, { question: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <Select value={d.status} onChange={(e) => setStatus(d.id, e.target.value as DecisionStatus)}>
            <option value="exploring">Exploring</option>
            <option value="modeling">Modeling</option>
            <option value="reviewing">Reviewing</option>
            <option value="decided">Decided</option>
          </Select>
        </Field>
        <Field label="Category">
          <Select value={d.category} onChange={(e) => updateDecision(d.id, { category: e.target.value as Category })}>
            <option value="career">Career</option>
            <option value="finance">Finance</option>
            <option value="tech">Tech</option>
            <option value="life">Life</option>
            <option value="travel">Travel</option>
          </Select>
        </Field>
        <Field label="Horizon">
          <Select value={d.timeHorizon} onChange={(e) => updateDecision(d.id, { timeHorizon: e.target.value })}>
            {['< 6 months', '6–12 months', '1–3 years', '3–5 years', '5+ years'].map((h) => (
              <option key={h}>{h}</option>
            ))}
          </Select>
        </Field>
        <Field label="Deadline">
          <Input
            type="date"
            value={d.deadline ? d.deadline.slice(0, 10) : ''}
            onChange={(e) => updateDecision(d.id, { deadline: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : undefined })}
          />
        </Field>
      </div>
      <Field label="Gut confidence" hint={`${d.baseConfidence}/100`}>
        <RangeSlider value={d.baseConfidence} min={0} max={100} ariaLabel="Gut confidence" onChange={(v) => updateDecision(d.id, { baseConfidence: v })} />
        <p className="mt-1 text-[11px] leading-snug text-[var(--faint)]">Blended with evidence quality and score margin into the model confidence.</p>
      </Field>
      <Field label="Dependencies" hint={`${d.dependencies.length}`}>
        <div className="flex flex-wrap gap-1.5">
          {d.dependencies.map((x, i) => (
            <span key={i} className="flex items-center gap-1 rounded-md bg-[var(--sunken)] px-2 py-1 text-[12px]">
              {x}
              <button className="text-[var(--faint)] hover:text-[var(--coral)] cursor-pointer" aria-label={`Remove ${x}`} onClick={() => updateDecision(d.id, { dependencies: d.dependencies.filter((_, j) => j !== i) })}>
                <IcX size={11} />
              </button>
            </span>
          ))}
        </div>
        <Input className="mt-2" value={dep} onChange={(e) => setDep(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDep()} placeholder="Add dependency ↵" />
      </Field>
      <Field label="Expected outcomes" hint={`${d.expectedOutcomes.length}`}>
        <div className="space-y-1.5">
          {d.expectedOutcomes.map((x, i) => (
            <div key={i} className="flex items-start gap-1.5 rounded-md bg-[var(--sunken)] px-2 py-1.5 text-[12px] leading-snug">
              <IcCheck size={12} className="mt-0.5 shrink-0 text-[var(--teal)]" />
              <span className="flex-1">{x}</span>
              <button className="text-[var(--faint)] hover:text-[var(--coral)] cursor-pointer" aria-label="Remove outcome" onClick={() => updateDecision(d.id, { expectedOutcomes: d.expectedOutcomes.filter((_, j) => j !== i) })}>
                <IcX size={11} />
              </button>
            </div>
          ))}
        </div>
        <Input className="mt-2" value={out} onChange={(e) => setOut(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOut()} placeholder="Add expectation ↵" />
      </Field>
      <button
        onClick={() => toast('Tip: log why you decided in the Journal tab', 'info')}
        className="w-full rounded-xl border border-dashed border-[var(--line-strong)] px-3 py-2.5 text-[12px] text-[var(--muted)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)] cursor-pointer"
      >
        <IcSpark size={12} className="mr-1.5 inline" /> Before deciding — write the why in the journal
      </button>
    </div>
  );
}

function OptionInspector({ d, optionId, model }: { d: Decision; optionId: string; model: ModelResult }) {
  const updateOption = useStore((s) => s.updateOption);
  const moveOption = useStore((s) => s.moveOption);
  const removeOption = useStore((s) => s.removeOption);
  const [confirm, setConfirm] = useState(false);
  const o = d.options.find((x) => x.id === optionId)!;
  const row = model.rows.find((r) => r.option.id === optionId);
  const idx = d.options.indexOf(o);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2.5">
        <span className="h-3 w-3 rounded-full" style={{ background: o.color }} />
        <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">Option</p>
        <div className="ml-auto flex gap-1">
          <IconBtn label="Move up" className="h-6 w-6" disabled={idx === 0} onClick={() => moveOption(d.id, o.id, -1)}><IcChevronUp size={13} /></IconBtn>
          <IconBtn label="Move down" className="h-6 w-6" disabled={idx === d.options.length - 1} onClick={() => moveOption(d.id, o.id, 1)}><IcChevronDown size={13} /></IconBtn>
        </div>
      </div>

      {row && (
        <div className="rounded-xl bg-[var(--sunken)]/70 p-3">
          <div className="flex items-baseline gap-2">
            <p className="font-data text-[24px] font-semibold" style={{ color: o.color }}>{row.adjusted.toFixed(1)}</p>
            <p className="font-data text-[10.5px] text-[var(--faint)]">raw {row.raw.toFixed(1)} − risk {row.penalty.toFixed(1)} · rank #{row.rank}</p>
          </div>
          <Meter value={row.adjusted} color={o.color} className="mt-2" />
        </div>
      )}

      <Field label="Name">
        <Input value={o.name} onChange={(e) => updateOption(d.id, o.id, { name: e.target.value })} />
      </Field>
      <Field label="Description">
        <Textarea value={o.description ?? ''} onChange={(e) => updateOption(d.id, o.id, { description: e.target.value })} placeholder="What does choosing this actually mean?" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost ($)">
          <Input type="number" value={o.cost ?? ''} onChange={(e) => updateOption(d.id, o.id, { cost: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="—" />
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {OPTION_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => updateOption(d.id, o.id, { color: c })}
                className={cn('h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer', o.color === c ? 'border-[var(--ink)]' : 'border-transparent')}
                style={{ background: c }}
                aria-label={`Set color ${c}`}
              />
            ))}
          </div>
        </Field>
      </div>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">Scores · 0–10</p>
        {d.criteria.length === 0 && <p className="text-[12px] text-[var(--faint)]">Add criteria first — scores attach to them.</p>}
        <div className="space-y-2.5">
          {d.criteria.map((c) => (
            <div key={c.id}>
              <div className="flex justify-between text-[12px]">
                <span className="font-medium">{c.name}</span>
                <span className="font-data text-[var(--muted)]">{o.scores[c.id] ?? 5}/10</span>
              </div>
              <RangeSlider value={o.scores[c.id] ?? 5} min={0} max={10} ariaLabel={`${c.name} score`} onChange={(v) => useStore.getState().setScore(d.id, o.id, c.id, v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-[var(--line)] pt-3">
        <Button variant="outline" size="sm" className="w-full" onClick={() => updateOption(d.id, o.id, { eliminated: !o.eliminated })}>
          {o.eliminated ? 'Restore to model' : 'Eliminate from model'}
        </Button>
        <Button variant="danger" size="sm" className="w-full" onClick={() => setConfirm(true)}>
          <IcTrash size={13} /> Remove option
        </Button>
      </div>
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => removeOption(d.id, o.id)}
        title={`Remove “${o.name}”?`}
        body="Scores, evidence and risks tied to this option will be removed."
        confirmLabel="Remove option"
      />
    </div>
  );
}

function CriterionInspector({ d, criterionId }: { d: Decision; criterionId: string }) {
  const updateCriterion = useStore((s) => s.updateCriterion);
  const moveCriterion = useStore((s) => s.moveCriterion);
  const removeCriterion = useStore((s) => s.removeCriterion);
  const [confirm, setConfirm] = useState(false);
  const c = d.criteria.find((x) => x.id === criterionId)!;
  const weights = normalizedWeights(d.criteria);
  const idx = d.criteria.indexOf(c);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2.5">
        <IcScale size={15} className="text-[var(--teal)]" />
        <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--faint)]">Criterion</p>
        <div className="ml-auto flex gap-1">
          <IconBtn label="Move up" className="h-6 w-6" disabled={idx === 0} onClick={() => moveCriterion(d.id, c.id, -1)}><IcChevronUp size={13} /></IconBtn>
          <IconBtn label="Move down" className="h-6 w-6" disabled={idx === d.criteria.length - 1} onClick={() => moveCriterion(d.id, c.id, 1)}><IcChevronDown size={13} /></IconBtn>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--sunken)]/70 p-3 text-center">
        <p className="font-display text-[28px] font-bold text-[var(--teal)]">{Math.round((weights[c.id] ?? 0) * 100)}%</p>
        <p className="font-data text-[10.5px] text-[var(--faint)]">of total model weight (auto-normalized)</p>
      </div>

      <Field label="Name">
        <Input value={c.name} onChange={(e) => updateCriterion(d.id, c.id, { name: e.target.value })} />
      </Field>
      <Field label="Note" hint="optional">
        <Input value={c.note ?? ''} onChange={(e) => updateCriterion(d.id, c.id, { note: e.target.value || undefined })} placeholder="e.g. 3-year total cost, not sticker" />
      </Field>
      <Field label="Raw weight" hint={`0–40 · now ${c.weight}`}>
        <RangeSlider value={c.weight} min={0} max={40} ariaLabel={`${c.name} weight`} onChange={(v) => updateCriterion(d.id, c.id, { weight: v })} />
        <p className="mt-1 text-[11px] leading-snug text-[var(--faint)]">Weights are relative — what matters is each criterion's share of the total.</p>
      </Field>

      <div className="space-y-2 border-t border-[var(--line)] pt-3">
        <div className="rounded-xl border border-[var(--line)] p-3">
          <p className="font-data text-[10px] uppercase tracking-widest text-[var(--faint)]">spread across options</p>
          <div className="mt-2 space-y-1.5">
            {d.options.map((o) => (
              <div key={o.id} className="flex items-center gap-2 text-[12px]">
                <span className="h-2 w-2 rounded-full" style={{ background: o.color }} />
                <span className="flex-1 truncate">{o.name}</span>
                <span className="font-data text-[var(--muted)]">{o.scores[c.id] ?? 5}/10</span>
              </div>
            ))}
          </div>
        </div>
        <Button variant="danger" size="sm" className="w-full" onClick={() => setConfirm(true)}>
          <IcTrash size={13} /> Remove criterion
        </Button>
      </div>
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => removeCriterion(d.id, c.id)}
        title={`Remove “${c.name}”?`}
        body="All option scores for this criterion will be dropped and weights re-normalized."
        confirmLabel="Remove criterion"
      />
    </div>
  );
}
