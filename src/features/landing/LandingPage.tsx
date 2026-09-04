import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { normalizedWeights } from '../../lib/engine';
import { Badge, Button, RangeSlider } from '../../components/ui';
import { Gauge, RankBars, RiskMatrix } from '../../components/charts';
import {
  IcArrowRight,
  IcArrowUpRight,
  IcBook,
  IcCheck,
  IcCompass,
  IcDoc,
  IcFlag,
  IcLayers,
  IcMoon,
  IcScale,
  IcShield,
  IcSliders,
  IcSpark,
  IcSun,
  IcTarget,
  Logo,
} from '../../components/icons';
import type { RiskItem } from '../../types';

/* ------------------------------ utilities ------------------------------ */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('reveal-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${className ?? ''}`}>
      {children}
    </div>
  );
}

const SCRAMBLE_CHARS = 'abcdefghjkmnpqrstuvwxyz<>/\\*';

function useScramble(words: string[], hold = 2400) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cancelled = false;
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      if (cancelled) return;
      idx = (idx + 1) % words.length;
      const target = words[idx];
      if (reduced) {
        setText(target);
        timer = setTimeout(cycle, hold);
        return;
      }
      let frame = 0;
      const total = 13;
      const tick = () => {
        if (cancelled) return;
        frame++;
        const reveal = Math.floor((frame / total) * target.length);
        let s = target.slice(0, reveal);
        for (let i = reveal; i < target.length; i++) s += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        setText(s);
        if (frame < total) timer = setTimeout(tick, 32);
        else {
          setText(target);
          timer = setTimeout(cycle, hold);
        }
      };
      tick();
    };
    timer = setTimeout(cycle, hold);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [words, hold]);
  return text;
}

/* ---------------------------- hero widget ------------------------------ */

const HW_OPTIONS = [
  { id: 'mac', name: 'MacBook Pro 14', color: '#0e8a68', scores: { perf: 9, price: 4, batt: 9, dev: 9 } },
  { id: 'x1', name: 'ThinkPad X1', color: '#4a7fae', scores: { perf: 8, price: 6, batt: 7, dev: 8 } },
  { id: 'keep', name: 'Keep current laptop', color: '#7c8a45', scores: { perf: 4, price: 10, batt: 5, dev: 5 } },
];
const HW_CRITERIA = [
  { id: 'perf', name: 'Performance', min: 5, max: 40 },
  { id: 'price', name: 'Price', min: 5, max: 40 },
  { id: 'batt', name: 'Battery life', min: 5, max: 30 },
  { id: 'dev', name: 'Dev experience', min: 5, max: 35 },
];

function HeroWidget() {
  const [weights, setWeights] = useState<Record<string, number>>({ perf: 26, price: 18, batt: 16, dev: 24 });
  const criteria = useMemo(() => HW_CRITERIA.map((c) => ({ id: c.id, name: c.name, weight: weights[c.id] })), [weights]);
  const norm = normalizedWeights(criteria);

  const rows = useMemo(() => {
    return HW_OPTIONS.map((o) => {
      let score = 0;
      for (const c of HW_CRITERIA) score += norm[c.id] * o.scores[c.id as keyof typeof o.scores];
      return { id: o.id, label: o.name, color: o.color, value: score * 10 };
    }).sort((a, b) => b.value - a.value);
  }, [norm]);

  const leader = rows[0];
  const margin = rows[0].value - rows[1].value;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--sunken)]/70 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--coral)] opacity-70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--amber)] opacity-70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--teal)] opacity-70" />
        <span className="ml-2 font-data text-[11px] text-[var(--faint)]">decision-space · live-model</span>
        <Badge tone="teal" className="ml-auto">recalculating</Badge>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_190px]">
        <div>
          <p className="font-display text-[14.5px] font-semibold">Which laptop for the next 4 years?</p>
          <p className="mt-0.5 font-data text-[11px] text-[var(--faint)]">3 options · 4 weighted criteria · drag to retune</p>
          <div className="mt-4">
            <RankBars rows={rows} />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--teal-soft)]/60 px-3 py-2.5">
            <IcSpark size={15} className="shrink-0 text-[var(--teal)]" />
            <p className="text-[12.5px] leading-snug text-[var(--ink)]" aria-live="polite">
              <strong className="font-semibold">{leader.label}</strong> leads by{' '}
              <span className="font-data font-semibold text-[var(--teal)]">{margin.toFixed(1)} pts</span> under the
              current weights.
            </p>
          </div>
        </div>

        <div className="space-y-3.5 rounded-xl border border-[var(--line)] bg-[var(--raise)] p-3.5">
          <p className="font-data text-[10px] font-medium uppercase tracking-widest text-[var(--faint)]">criteria weights</p>
          {HW_CRITERIA.map((c) => (
            <div key={c.id}>
              <div className="mb-0.5 flex justify-between text-[12px]">
                <span className="font-medium">{c.name}</span>
                <span className="font-data text-[var(--muted)]">{Math.round((norm[c.id] ?? 0) * 100)}%</span>
              </div>
              <RangeSlider
                value={weights[c.id]}
                min={c.min}
                max={c.max}
                ariaLabel={`${c.name} weight`}
                onChange={(v) => setWeights((w) => ({ ...w, [c.id]: v }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- what-if teaser ---------------------------- */

function WhatIfTeaser() {
  const [battery, setBattery] = useState(16);
  const [price, setPrice] = useState(18);
  const norm = useMemo(
    () =>
      normalizedWeights([
        { id: 'perf', name: 'p', weight: 26 },
        { id: 'price', name: 'p', weight: price },
        { id: 'batt', name: 'b', weight: battery },
        { id: 'dev', name: 'd', weight: 24 },
      ]),
    [battery, price],
  );
  const rows = useMemo(() => {
    const w = norm;
    return HW_OPTIONS.map((o) => ({
      id: o.id,
      label: o.name,
      color: o.color,
      value: (w.perf * o.scores.perf + w.price * o.scores.price + w.batt * o.scores.batt + w.dev * o.scores.dev) * 10,
      delta: (w.batt - 0.19) * o.scores.batt * 10 * 3,
    })).sort((a, b) => b.value - a.value);
  }, [battery, price]);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-0.5 flex justify-between text-[12px]"><span className="font-medium">Battery life</span><span className="font-data text-[var(--teal)]">{Math.round((norm.batt ?? 0) * 100)}%</span></div>
          <RangeSlider value={battery} min={5} max={30} ariaLabel="Battery weight" onChange={setBattery} />
        </div>
        <div>
          <div className="mb-0.5 flex justify-between text-[12px]"><span className="font-medium">Price</span><span className="font-data text-[var(--muted)]">{Math.round((norm.price ?? 0) * 100)}%</span></div>
          <RangeSlider value={price} min={5} max={30} ariaLabel="Price weight" onChange={setPrice} />
        </div>
      </div>
      <div className="mt-4">
        <RankBars rows={rows} showDelta />
      </div>
    </div>
  );
}

/* ------------------------------ sections ------------------------------- */

const MARQUEE = [
  '“take the job or stay?”', '“move to Austin?”', '“MacBook vs ThinkPad?”', '“hire now or contract?”',
  '“buy or lease?”', '“switch stacks?”', '“go back to school?”', '“sell the car?”', '“move in together?”',
  '“bootstrap or raise?”', '“Lisbon for a year?”', '“negotiate one more round?”',
];

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: ReactNode; body?: string }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="font-data text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">{eyebrow}</p>
      <h2 className="font-display mt-2 text-[clamp(26px,4vw,40px)] font-bold leading-[1.08] tracking-tight">{title}</h2>
      {body && <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{body}</p>}
    </Reveal>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <div className="group h-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--teal-soft)] text-[var(--teal)] transition-transform duration-300 group-hover:scale-110">
            {icon}
          </span>
          <h3 className="font-display text-[15.5px] font-semibold">{title}</h3>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{body}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </Reveal>
  );
}

const WALKTHROUGH_STEPS = [
  {
    n: '01',
    title: 'Frame the question',
    body: 'A decision starts as a single honest sentence — “Should I buy a new laptop or keep mine?” — plus a horizon, a deadline and the dependencies you can’t control.',
    mock: (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--raise)] p-4">
        <p className="font-data text-[10px] uppercase tracking-widest text-[var(--faint)]">question</p>
        <p className="font-display mt-1 text-[16px] font-semibold">Should I buy a new laptop — or squeeze another year out of the current one?</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="teal">horizon · 3–5y</Badge>
          <Badge tone="amber">deadline · 9d</Badge>
          <Badge tone="neutral">2 dependencies</Badge>
        </div>
      </div>
    ),
  },
  {
    n: '02',
    title: 'Model options against criteria',
    body: 'Every option is scored 0–10 on the criteria you actually care about. Weights make your priorities explicit — performance over price, battery over brand.',
    mock: (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--raise)] p-4">
        {[
          ['Performance', '22%', 82],
          ['Price', '18%', 64],
          ['Dev experience', '20%', 76],
        ].map(([n, w, v]) => (
          <div key={n as string} className="mb-2.5 last:mb-0">
            <div className="flex justify-between text-[12px]"><span className="font-medium">{n}</span><span className="font-data text-[var(--faint)]">{w}</span></div>
            <div className="mt-1 h-2 rounded-full bg-[var(--sunken)]"><div className="h-full rounded-full bg-[var(--teal)]" style={{ width: `${v}%` }} /></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    n: '03',
    title: 'Stress-test with What-If',
    body: 'Push battery weight to 40%. Drop an option’s score. Halve the risk. The recommendation, the charts and the confidence all recompute instantly — and NEXUS tells you who benefits.',
    mock: (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--raise)] p-4">
        <p className="font-data text-[10px] uppercase tracking-widest text-[var(--faint)]">what-if output</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed">Battery life 19% → 34% moves <strong className="text-[var(--teal)]">MacBook Pro</strong> from #2 to #1 and widens the lead to <span className="font-data font-semibold">6.8 pts</span>.</p>
      </div>
    ),
  },
  {
    n: '04',
    title: 'Commit, then review',
    body: 'Log the decision and what you expect. Months later, journal the outcome. Expected-vs-reality is how NEXUS calibrates the way you decide — not just this call, but the next ten.',
    mock: (
      <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--raise)] p-4 sm:grid-cols-2">
        <div>
          <p className="font-data text-[10px] uppercase tracking-widest text-[var(--amber)]">expected</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">Builds under 40s, all-day battery, $3k buffer kept.</p>
        </div>
        <div>
          <p className="font-data text-[10px] uppercase tracking-widest text-[var(--teal)]">reality, 6 wks</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">31s builds, 11h battery. Buffer intact. Expectation held.</p>
        </div>
      </div>
    ),
  },
];

const QUOTES = [
  {
    q: 'I’d been circling the same relocation question for a year. NEXUS made me admit what I actually weighted — community beat weather. Decided in a weekend.',
    name: 'Maya K.',
    role: 'Product designer, moved to Porto',
    big: true,
  },
  {
    q: 'The What-If mode is the feature I didn’t know I needed. Watching the recommendation flip when I doubled “stability” told me more than any pros/cons list ever did.',
    name: 'Daniel R.',
    role: 'Staff engineer',
  },
  {
    q: 'We used it for a $40k vendor decision. The risk matrix alone justified the exercise — our “obvious” pick had a 4×5 risk nobody had said out loud.',
    name: 'Priya S.',
    role: 'Ops lead, 40-person startup',
  },
];

const RISKS_MINI: RiskItem[] = [
  { id: 'rm1', name: 'Budget overrun', probability: 3, impact: 4, mitigation: '' },
  { id: 'rm2', name: 'Machine dies early', probability: 4, impact: 5, mitigation: '' },
  { id: 'rm3', name: 'Discount expires', probability: 2, impact: 2, mitigation: '' },
  { id: 'rm4', name: 'Toolchain gap', probability: 2, impact: 3, mitigation: '' },
];

/* --------------------------------- page -------------------------------- */

export function LandingPage() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const scrambled = useScramble([
    '“which laptop?”', '“take the offer?”', '“move to Austin?”', '“negotiate again?”', '“bootstrap or raise?”',
  ]);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="grid-lines absolute inset-0 opacity-[0.5]" style={{ maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 20%, transparent 75%)' }} />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.13] blur-3xl" style={{ background: 'radial-gradient(closest-side, var(--teal), transparent 70%)' }} />
      </div>

      {/* nav */}
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-[17px] font-bold tracking-tight">NEXUS</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-5 text-[13.5px] font-medium text-[var(--muted)] md:flex">
            <a href="#product" className="transition-colors hover:text-[var(--ink)]">Product</a>
            <a href="#method" className="transition-colors hover:text-[var(--ink)]">Method</a>
            <a href="#stories" className="transition-colors hover:text-[var(--ink)]">Stories</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] transition-colors hover:text-[var(--ink)] cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <IcSun size={16} /> : <IcMoon size={16} />}
            </button>
            <Link to="/app">
              <Button>Open workspace <IcArrowRight size={14} /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="font-data inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[11.5px] text-[var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)] anim-pulse-dot" />
              now modeling <span className="text-[var(--teal)]">{scrambled}</span>
            </p>
            <h1 className="font-display reveal-in mt-5 text-[clamp(38px,6.2vw,68px)] font-bold leading-[1.02] tracking-[-0.03em]">
              <span className="mask-line"><span>Stop weighing</span></span>
              <span className="mask-line"><span>decisions</span></span>
              <span className="mask-line"><span style={{ color: 'var(--teal)' }}>in your head.</span></span>
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[var(--muted)]">
              NEXUS turns a hard choice into a living model — options, weighted criteria, evidence and risk — then
              recalculates the strongest path every time you change your mind.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/app">
                <Button size="lg">Open the workspace <IcArrowRight size={15} /></Button>
              </Link>
              <a href="#product">
                <Button size="lg" variant="outline">See the model work</Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-data text-[11.5px] text-[var(--faint)]">
              <span className="flex items-center gap-1.5"><IcCheck size={12} className="text-[var(--teal)]" /> free while in beta</span>
              <span className="flex items-center gap-1.5"><IcCheck size={12} className="text-[var(--teal)]" /> data stays in your browser</span>
              <span className="flex items-center gap-1.5"><IcCheck size={12} className="text-[var(--teal)]" /> ⌘K everywhere</span>
            </div>
          </div>

          <div className="relative">
            <svg className="absolute -inset-8 -z-10 h-[calc(100%+4rem)] w-[calc(100%+4rem)] text-[var(--line-strong)] opacity-40 anim-drift" viewBox="0 0 400 400" fill="none" aria-hidden="true">
              <circle cx="200" cy="200" r="150" stroke="currentColor" strokeDasharray="3 8" />
              <circle cx="200" cy="200" r="190" stroke="currentColor" strokeDasharray="2 12" />
              <circle cx="310" cy="105" r="4" fill="var(--teal)" />
              <circle cx="95" cy="300" r="4" fill="var(--amber)" />
            </svg>
            <HeroWidget />
            <p className="mt-3 text-center font-data text-[10.5px] text-[var(--faint)]">↑ this is the product — drag the weights</p>
          </div>
        </div>
      </section>

      {/* marquee */}
      <section className="marquee overflow-hidden border-y border-[var(--line)] bg-[var(--surface)] py-3.5">
        <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap font-data text-[12.5px] text-[var(--muted)]">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-8">
              {m} <span className="text-[var(--teal)]">✳</span>
            </span>
          ))}
        </div>
      </section>

      {/* stats rail */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Reveal>
          <div className="grid grid-cols-2 divide-x divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] sm:grid-cols-4 sm:divide-y-0">
            {[
              ['12,400+', 'decisions modeled'],
              ['38%', 'avg. confidence lift'],
              ['2.1×', 'faster to decide'],
              ['9/10', 'would use again'],
            ].map(([v, l]) => (
              <div key={l} className="px-5 py-6 text-center">
                <p className="font-display text-[clamp(22px,3vw,30px)] font-bold text-[var(--teal)]">{v}</p>
                <p className="mt-1 font-data text-[10.5px] uppercase tracking-wider text-[var(--faint)]">{l}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* anatomy */}
      <section id="model" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionHead
          eyebrow="the anatomy"
          title={<>A decision is a structure,<br />not a mood.</>}
          body="Every Decision Space in NEXUS is the same five-layer model. Fill it in once and you can interrogate it forever."
        />
        <div className="relative mt-12 grid gap-0 pl-8 sm:pl-0">
          <div className="absolute bottom-4 left-[15px] top-4 sm:left-[calc(50%-1px)]">
            <div className="spine h-full" />
          </div>
          {[
            { icon: <IcTarget size={17} />, t: 'Decision', b: 'The question, the horizon, the deadline, the dependencies.', side: 'left' },
            { icon: <IcCompass size={17} />, t: 'Options', b: 'Every live path — scored, costed, never assumed.', side: 'right' },
            { icon: <IcScale size={17} />, t: 'Criteria + weights', b: 'What matters, and how much. Weights are the soul of the model.', side: 'left' },
            { icon: <IcShield size={17} />, t: 'Evidence & risks', b: 'Sources with reliability ratings; risks plotted by probability × impact.', side: 'right' },
            { icon: <IcFlag size={17} />, t: 'Outcome', b: 'A recommendation you can defend — and revisit when reality reports back.', side: 'left' },
          ].map((s, i) => (
            <Reveal key={s.t} className="relative pb-8">
              <div className={`sm:flex ${s.side === 'right' ? 'sm:justify-start sm:pl-[calc(50%+2.5rem)]' : 'sm:justify-end sm:pr-[calc(50%+2.5rem)]'}`}>
                <span className="absolute left-[7px] top-1 flex h-[17px] w-[17px] items-center justify-center rounded-full border-2 border-[var(--teal)] bg-[var(--bg)] sm:left-[calc(50%-8.5px)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
                </span>
                <div className="max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--teal-soft)] text-[var(--teal)]">{s.icon}</span>
                    <h3 className="font-display text-[15.5px] font-semibold">
                      <span className="font-data mr-2 text-[11px] text-[var(--faint)]">{String(i + 1).padStart(2, '0')}</span>
                      {s.t}
                    </h3>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{s.b}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="product" className="border-y border-[var(--line)] bg-[var(--surface)]/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            eyebrow="capabilities"
            title={<>Built to be argued with.</>}
            body="Every surface is interactive. Change an input and watch the whole position shift — that's the point."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-12">
            <FeatureCard
              className="md:col-span-7"
              icon={<IcSliders size={16} />}
              title="What-If mode"
              body="Drag a weight, rescore an option, halve a risk. The ranking, the margin and the recommendation recompute live — with a plain-language readout of who just gained."
            >
              <WhatIfTeaser />
            </FeatureCard>
            <FeatureCard
              className="md:col-span-5"
              icon={<IcShield size={16} />}
              title="Risk matrix"
              body="Probability × impact, plotted. The penalty flows straight into each option's score, so a cheap option with a 4×5 risk stops looking cheap."
            >
              <div className="rounded-xl border border-[var(--line)] bg-[var(--raise)] p-3">
                <RiskMatrix risks={RISKS_MINI} compact />
              </div>
            </FeatureCard>
            <FeatureCard
              className="md:col-span-5"
              icon={<IcDoc size={16} />}
              title="Evidence with a stance"
              body="Every claim gets a source, a reliability rating, and a stance — supporting, contradicting or neutral. Counter-evidence is a first-class citizen."
            >
              <div className="space-y-2">
                {[
                  { t: 'NotebookCheck battery rundown', s: 'supporting', tone: 'teal' as const },
                  { t: 'My repair log, last 12 months', s: 'contradicting', tone: 'coral' as const },
                  { t: 'Corporate discount confirmation', s: 'supporting', tone: 'teal' as const },
                ].map((e) => (
                  <div key={e.t} className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--raise)] px-3 py-2">
                    <span className="truncate text-[12.5px] font-medium">{e.t}</span>
                    <Badge tone={e.tone}>{e.s}</Badge>
                  </div>
                ))}
              </div>
            </FeatureCard>
            <FeatureCard
              className="md:col-span-7"
              icon={<IcLayers size={16} />}
              title="Scenarios, side by side"
              body="Freeze the model under different worlds — tight budget, dev-first year, remote confirmed — and see where the recommendation holds and where it fractures."
            >
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { n: 'Baseline', w: 'MacBook Pro', s: '71.4', diff: false },
                  { n: 'Tight budget', w: 'ThinkPad X1', s: '66.9', diff: true },
                  { n: 'Dev-first', w: 'MacBook Pro', s: '78.2', diff: false },
                ].map((sc) => (
                  <div key={sc.n} className="rounded-xl border border-[var(--line)] bg-[var(--raise)] p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-data text-[10px] uppercase tracking-wider text-[var(--faint)]">{sc.n}</p>
                      {sc.diff && <Badge tone="amber">diverges</Badge>}
                    </div>
                    <p className="mt-1.5 truncate text-[13px] font-semibold">{sc.w}</p>
                    <p className="font-data text-[11px] text-[var(--teal)]">{sc.s} pts</p>
                  </div>
                ))}
              </div>
            </FeatureCard>
            <FeatureCard
              className="md:col-span-12"
              icon={<IcBook size={16} />}
              title="The decision journal"
              body="Log why you decided and what you expect. When reality arrives, log that too. The expected-vs-reality record is how you learn whether your models — and your gut — deserve trust."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--amber)]/30 bg-[var(--amber-soft)]/40 p-4">
                  <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--amber)]">expected · day 0</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed">“Builds under 40s, all-day battery, $3k buffer kept after the bonus.”</p>
                </div>
                <div className="rounded-xl border border-[var(--teal)]/30 bg-[var(--teal-soft)]/40 p-4">
                  <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-[var(--teal)]">reality · week 6</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed">“31s builds, 11h battery, buffer intact. Expectation held — revisit at month 6.”</p>
                </div>
              </div>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* walkthrough — sticky two column */}
      <section id="method" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHead
              eyebrow="how it works"
              title={<>Four moves from<br />fog to decision.</>}
              body="The same loop whether the stakes are a laptop or a life. Ten minutes to build the model — sometimes years of regret avoided."
            />
            <div className="mt-8 hidden space-y-4 lg:block">
              <Gauge value={76} label="model confidence" />
              <p className="font-data text-[11px] leading-relaxed text-[var(--faint)]">
                Confidence blends your gut read,<br />evidence quality and the score margin.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            {WALKTHROUGH_STEPS.map((s) => (
              <Reveal key={s.n}>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-md)]">
                  <div className="flex items-baseline gap-3">
                    <span className="font-data text-[13px] font-semibold text-[var(--teal)]">{s.n}</span>
                    <h3 className="font-display text-[18px] font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">{s.body}</p>
                  <div className="mt-4">{s.mock}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* social proof */}
      <section id="stories" className="border-y border-[var(--line)] bg-[var(--surface)]/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead eyebrow="field notes" title={<>People decide differently<br />after their first space.</>} />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {QUOTES.map((q, i) => (
              <Reveal key={q.name} className={q.big ? 'md:row-span-2' : ''}>
                <figure className={`flex h-full flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--raise)] p-6 shadow-[var(--shadow-sm)] ${q.big ? 'bg-[var(--ink)] text-[var(--bg)]' : ''}`}>
                  <blockquote className={`font-display text-[${q.big ? '22px' : '16px'}] leading-snug font-semibold`} style={{ fontSize: q.big ? 'clamp(19px,2.4vw,24px)' : '16px' }}>
                    “{q.q}”
                  </blockquote>
                  <figcaption className={`mt-5 flex items-center gap-3 ${q.big ? 'text-[var(--bg)]' : ''}`}>
                    <span className={`font-display flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold ${q.big ? 'bg-[var(--teal)] text-[var(--bg)]' : 'bg-[var(--teal-soft)] text-[var(--teal)]'}`}>
                      {q.name.slice(0, 1)}
                    </span>
                    <span>
                      <span className="block text-[13px] font-semibold">{q.name}</span>
                      <span className={`block font-data text-[10.5px] ${q.big ? 'opacity-60' : 'text-[var(--faint)]'}`}>{q.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl" style={{ background: 'radial-gradient(closest-side, var(--teal), transparent 70%)' }} />
        </div>
        <Reveal className="mx-auto max-w-3xl px-4 text-center">
          <p className="font-data text-[12px] text-[var(--muted)]">the question you keep postponing →</p>
          <h2 className="font-display mt-3 text-[clamp(30px,5.5vw,56px)] font-bold leading-[1.05] tracking-tight">
            Give it a model.<br /><span style={{ color: 'var(--teal)' }}>Tonight.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
            Open a Decision Space, weigh what actually matters, and see the answer you've been avoiding — or confirm the one you already had.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/app">
              <Button size="lg">Start your first space <IcArrowUpRight size={15} /></Button>
            </Link>
            <span className="font-data flex items-center gap-1.5 text-[11.5px] text-[var(--faint)]">
              press <span className="flex gap-0.5"><kbd className="rounded-md border border-[var(--line-strong)] bg-[var(--sunken)] px-1.5 py-0.5">⌘</kbd><kbd className="rounded-md border border-[var(--line-strong)] bg-[var(--sunken)] px-1.5 py-0.5">K</kbd></span> anywhere inside
            </span>
          </div>
        </Reveal>
      </section>

      {/* footer */}
      <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={26} />
              <span className="font-display text-[16px] font-bold">NEXUS</span>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-[var(--muted)]">
              Personal decision intelligence. Model the choice, stress-test the answer, learn from the outcome.
            </p>
            <p className="mt-4 font-data text-[10.5px] text-[var(--faint)]">© 2026 Nexus Labs — a design-engineering study.</p>
          </div>
          {[
            { h: 'Product', items: [['Decision Spaces', '#model'], ['What-If mode', '#product'], ['Scenarios', '#product'], ['Journal', '#product']] },
            { h: 'Method', items: [['Anatomy', '#model'], ['How it works', '#method'], ['Field notes', '#stories']] },
            { h: 'Inside', items: [['Open workspace', '/app'], ['Command palette', '/app'], ['Settings', '/app']] },
          ].map((col) => (
            <div key={col.h}>
              <h4 className="font-data text-[10.5px] font-semibold uppercase tracking-widest text-[var(--faint)]">{col.h}</h4>
              <ul className="mt-3 space-y-2 text-[13.5px]">
                {col.items.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith('/') ? (
                      <Link to={href} className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]">{label}</Link>
                    ) : (
                      <a href={href} className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]">{label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
