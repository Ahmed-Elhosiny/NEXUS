import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Kbd } from './ui';
import {
  IcArrowUpRight,
  IcBook,
  IcChart,
  IcCheck,
  IcCompass,
  IcDoc,
  IcGrid,
  IcLayers,
  IcMoon,
  IcPlus,
  IcScale,
  IcSearch,
  IcSettings,
  IcShield,
  IcSliders,
  IcSun,
  IcTarget,
} from './icons';

interface Cmd {
  id: string;
  group: string;
  label: string;
  sub?: string;
  icon: ReactNode;
  keywords?: string;
  run: () => void;
}

function Hi({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-[var(--amber-soft)] px-0.5 text-[var(--amber)]">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPaletteOpen);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const decisions = useStore((s) => s.decisions);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const recentSearches = useStore((s) => s.recentSearches);
  const addRecentSearch = useStore((s) => s.addRecentSearch);
  const toast = useStore((s) => s.toast);

  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeId = useMemo(() => {
    const m = loc.pathname.match(/^\/app\/decision\/([^/]+)/);
    return m?.[1];
  }, [loc.pathname]);

  const active = decisions.find((d) => d.id === activeId) ?? decisions[0];

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const go = (path: string, after?: () => void) => {
    setOpen(false);
    nav(path);
    after?.();
  };

  const commands = useMemo<Cmd[]>(() => {
    const base: Cmd[] = [
      {
        id: 'new',
        group: 'Actions',
        label: 'Create decision',
        icon: <IcPlus size={15} />,
        keywords: 'new space add',
        run: () => go('/app?new=1'),
      },
      {
        id: 'dash',
        group: 'Actions',
        label: 'Go to dashboard',
        icon: <IcGrid size={15} />,
        run: () => go('/app'),
      },
      {
        id: 'theme',
        group: 'Actions',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: theme === 'dark' ? <IcSun size={15} /> : <IcMoon size={15} />,
        keywords: 'appearance mode',
        run: () => {
          toggleTheme();
          setOpen(false);
          toast(`Switched to ${theme === 'dark' ? 'light' : 'dark'} theme`, 'info');
        },
      },
      {
        id: 'settings',
        group: 'Actions',
        label: 'Open settings',
        icon: <IcSettings size={15} />,
        run: () => {
          setSettingsOpen(true);
          setOpen(false);
        },
      },
    ];
    if (active) {
      base.push(
        {
          id: 'canvas',
          group: active.title,
          label: 'Open decision canvas',
          icon: <IcTarget size={15} />,
          run: () => go(`/app/decision/${active.id}/canvas`),
        },
        {
          id: 'analysis',
          group: active.title,
          label: 'Open analysis',
          icon: <IcChart size={15} />,
          keywords: 'recommendation score',
          run: () => go(`/app/decision/${active.id}/analysis`),
        },
        {
          id: 'whatif',
          group: active.title,
          label: 'Toggle What-If mode',
          icon: <IcSliders size={15} />,
          keywords: 'weights simulate',
          run: () => go(`/app/decision/${active.id}/whatif`),
        },
        {
          id: 'addopt',
          group: active.title,
          label: 'Add option',
          icon: <IcCompass size={15} />,
          run: () => go(`/app/decision/${active.id}/canvas?add=option`),
        },
        {
          id: 'addcrit',
          group: active.title,
          label: 'Add criterion',
          icon: <IcScale size={15} />,
          run: () => go(`/app/decision/${active.id}/canvas?add=criterion`),
        },
      );
    }
    decisions.forEach((d) => {
      base.push({
        id: `open-${d.id}`,
        group: 'Decision spaces',
        label: d.title,
        sub: `${d.options.length} options · ${d.status}`,
        icon: <IcArrowUpRight size={15} />,
        run: () => go(`/app/decision/${d.id}/canvas`),
      });
    });
    return base;
  }, [active, decisions, theme, loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo<Cmd[]>(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const out: Cmd[] = [];
    const hit = (s: string | undefined) => s?.toLowerCase().includes(query);
    for (const d of decisions) {
      if (hit(d.title) || hit(d.question)) {
        out.push({
          id: `r-d-${d.id}`,
          group: 'Decisions',
          label: d.title,
          sub: d.question,
          icon: <IcTarget size={15} />,
          run: () => go(`/app/decision/${d.id}/canvas`, () => addRecentSearch(q.trim())),
        });
      }
      for (const o of d.options) {
        if (hit(o.name) || hit(o.description)) {
          out.push({
            id: `r-o-${o.id}`,
            group: 'Options',
            label: o.name,
            sub: d.title,
            icon: <IcCompass size={15} />,
            run: () => go(`/app/decision/${d.id}/canvas`, () => addRecentSearch(q.trim())),
          });
        }
      }
      for (const c of d.criteria) {
        if (hit(c.name)) {
          out.push({
            id: `r-c-${c.id}`,
            group: 'Criteria',
            label: c.name,
            sub: `${d.title} · weight ${c.weight}`,
            icon: <IcScale size={15} />,
            run: () => go(`/app/decision/${d.id}/canvas`, () => addRecentSearch(q.trim())),
          });
        }
      }
      for (const e of d.evidence) {
        if (hit(e.title) || hit(e.description) || hit(e.source)) {
          out.push({
            id: `r-e-${e.id}`,
            group: 'Evidence',
            label: e.title,
            sub: `${d.title} · ${e.source}`,
            icon: <IcDoc size={15} />,
            run: () => go(`/app/decision/${d.id}/evidence`, () => addRecentSearch(q.trim())),
          });
        }
      }
      for (const r of d.risks) {
        if (hit(r.name) || hit(r.mitigation)) {
          out.push({
            id: `r-r-${r.id}`,
            group: 'Risks',
            label: r.name,
            sub: `${d.title} · P${r.probability}×I${r.impact}`,
            icon: <IcShield size={15} />,
            run: () => go(`/app/decision/${d.id}/risks`, () => addRecentSearch(q.trim())),
          });
        }
      }
      for (const j of d.journal) {
        if (hit(j.title) || hit(j.body)) {
          out.push({
            id: `r-j-${j.id}`,
            group: 'Journal',
            label: j.title,
            sub: d.title,
            icon: <IcBook size={15} />,
            run: () => go(`/app/decision/${d.id}/journal`, () => addRecentSearch(q.trim())),
          });
        }
      }
      for (const s of d.scenarios) {
        if (hit(s.name)) {
          out.push({
            id: `r-s-${s.id}`,
            group: 'Scenarios',
            label: s.name,
            sub: d.title,
            icon: <IcLayers size={15} />,
            run: () => go(`/app/decision/${d.id}/scenarios`, () => addRecentSearch(q.trim())),
          });
        }
      }
    }
    return out.slice(0, 14);
  }, [q, decisions]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    let cmds = commands;
    if (query) {
      cmds = commands.filter(
        (c) => c.label.toLowerCase().includes(query) || c.keywords?.toLowerCase().includes(query),
      );
    }
    const items = [...cmds];
    if (results.length) items.push(...results);
    if (!query && recentSearches.length) {
      items.push(
        ...recentSearches.map<Cmd>((r) => ({
          id: `recent-${r}`,
          group: 'Recent searches',
          label: r,
          icon: <IcSearch size={15} />,
          run: () => setQ(r),
        })),
      );
    }
    return items;
  }, [commands, results, q, recentSearches]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, visible.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel((s) => Math.max(s - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        visible[sel]?.run();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, visible, sel, setOpen]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="anim-pop relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4">
          <IcSearch size={16} className="shrink-0 text-[var(--faint)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={active ? `Search “${active.title}” or type a command…` : 'Search decisions or type a command…'}
            className="h-12 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-[var(--faint)]"
            aria-label="Search or command"
          />
          <Kbd>esc</Kbd>
        </div>
        <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-1.5">
          {visible.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">
              Nothing matches “{q}” across decisions, options, criteria, evidence, risks or journal.
            </p>
          )}
          {visible.map((c, i) => {
            const showGroup = c.group !== lastGroup;
            lastGroup = c.group;
            return (
              <div key={c.id}>
                {showGroup && (
                  <p className="px-3 pb-1 pt-2.5 font-data text-[10px] font-medium uppercase tracking-widest text-[var(--faint)]">
                    {c.group}
                  </p>
                )}
                <button
                  data-idx={i}
                  onMouseEnter={() => setSel(i)}
                  onClick={c.run}
                  className={cnRow(i === sel)}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--sunken)] text-[var(--muted)]">
                    {c.icon}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[13.5px] font-medium">
                      <Hi text={c.label} q={q} />
                    </span>
                    {c.sub && (
                      <span className="block truncate text-[11.5px] text-[var(--faint)]">
                        <Hi text={c.sub} q={q} />
                      </span>
                    )}
                  </span>
                  {i === sel && <IcCheck size={13} className="shrink-0 text-[var(--teal)]" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--line)] bg-[var(--sunken)]/60 px-4 py-2 font-data text-[10.5px] text-[var(--faint)]">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
          <span className="ml-auto flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}

const cnRow = (active: boolean) =>
  [
    'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors duration-100 cursor-pointer',
    active ? 'bg-[var(--teal-soft)]' : 'hover:bg-[var(--sunken)]',
  ].join(' ');
