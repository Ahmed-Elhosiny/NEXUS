import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { cn, daysUntil, timeAgo } from '../lib/engine';
import {
  Badge,
  Button,
  Confirm,
  IconBtn,
  Kbd,
  Modal,
  Skeleton,
} from './ui';
import {
  IcBell,
  IcGrid,
  IcLayers,
  IcDoc,
  IcAlert,
  IcClock,
  IcCheck,
  IcMenu,
  IcMoon,
  IcPlus,
  IcRefresh,
  IcSearch,
  IcSettings,
  IcSun,
  IcX,
  Logo,
} from './icons';

/* --------------------------- notification bit -------------------------- */

const NOTIF_META: Record<string, { icon: ReactNode; cls: string }> = {
  review: { icon: <IcClock size={14} />, cls: 'bg-[var(--amber-soft)] text-[var(--amber)]' },
  evidence: { icon: <IcDoc size={14} />, cls: 'bg-[var(--teal-soft)] text-[var(--teal)]' },
  scenario: { icon: <IcLayers size={14} />, cls: 'bg-[var(--blue-soft)] text-[var(--blue)]' },
  confidence: { icon: <IcAlert size={14} />, cls: 'bg-[var(--coral-soft)] text-[var(--coral)]' },
  reminder: { icon: <IcBell size={14} />, cls: 'bg-[var(--sunken)] text-[var(--muted)]' },
};

function NotificationsBell() {
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markRead);
  const markAllRead = useStore((s) => s.markAllRead);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--sunken)] hover:text-[var(--ink)] cursor-pointer"
        aria-label={`Notifications (${unread} unread)`}
      >
        <IcBell size={17} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--coral)] px-1 font-data text-[9px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="anim-pop absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
            <h3 className="font-display text-[13.5px] font-semibold">Notifications</h3>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <IcCheck size={13} /> Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">You're all caught up.</p>
            )}
            {notifications.map((n) => {
              const meta = NOTIF_META[n.kind] ?? NOTIF_META.reminder;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    if (n.decisionId) nav(`/app/decision/${n.decisionId}/canvas`);
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-[var(--line)] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[var(--sunken)] cursor-pointer',
                    !n.read && 'bg-[var(--teal-soft)]/30',
                  )}
                >
                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.cls)}>
                    {meta.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--muted)]">{n.body}</span>
                    <span className="mt-1 block font-data text-[10px] text-[var(--faint)]">{timeAgo(n.date)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ settings ------------------------------ */

function SettingsModal() {
  const open = useStore((s) => s.settingsOpen);
  const setOpen = useStore((s) => s.setSettingsOpen);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const resetDemo = useStore((s) => s.resetDemo);
  const toast = useStore((s) => s.toast);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} title="Settings">
        <div className="space-y-6">
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--faint)]">Appearance</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTheme(t);
                    toast(`Switched to ${t} theme`, 'info');
                  }}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border p-3 transition-all cursor-pointer',
                    theme === t
                      ? 'border-[var(--teal)] bg-[var(--teal-soft)]/50 ring-2 ring-[var(--ring)]'
                      : 'border-[var(--line)] hover:border-[var(--line-strong)]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      t === 'light' ? 'bg-[#f1f2ee] text-[#b97517] border border-[#dcdfd5]' : 'bg-[#121917] text-[#3ecfa3] border border-[#243029]',
                    )}
                  >
                    {t === 'light' ? <IcSun size={15} /> : <IcMoon size={15} />}
                  </span>
                  <span className="text-[13px] font-semibold capitalize">{t}</span>
                  {theme === t && <IcCheck size={14} className="ml-auto text-[var(--teal)]" />}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--faint)]">Data</h4>
            <div className="flex items-center justify-between rounded-xl border border-[var(--line)] p-3">
              <div>
                <p className="text-[13px] font-semibold">Restore demo data</p>
                <p className="text-[12px] text-[var(--muted)]">Replaces all spaces with the original four examples.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
                <IcRefresh size={13} /> Reset
              </Button>
            </div>
          </section>
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--faint)]">Keyboard</h4>
            <ul className="space-y-1.5 text-[13px] text-[var(--muted)]">
              <li className="flex justify-between"><span>Command palette & search</span><span className="flex gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd></span></li>
              <li className="flex justify-between"><span>Close dialogs</span><Kbd>esc</Kbd></li>
            </ul>
          </section>
          <p className="border-t border-[var(--line)] pt-4 font-data text-[10.5px] text-[var(--faint)]">
            NEXUS v1.0 · decisions are stored locally in your browser. Animations respect your reduced-motion preference.
          </p>
        </div>
      </Modal>
      <Confirm
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetDemo}
        title="Restore demo data?"
        body="Every decision space, edit and journal entry you've made will be replaced with the original demo data."
        confirmLabel="Reset data"
      />
    </>
  );
}

/* ------------------------------- sidebar ------------------------------ */

const STATUS_DOT: Record<string, string> = {
  exploring: 'var(--blue)',
  modeling: 'var(--amber)',
  reviewing: 'var(--coral)',
  decided: 'var(--teal)',
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const decisions = useStore((s) => s.decisions);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const nav = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <Logo size={28} />
        <span className="font-display text-[17px] font-bold tracking-tight">NEXUS</span>
        <Badge tone="teal" className="ml-auto">v1</Badge>
      </div>

      <div className="px-3">
        <button
          onClick={() => {
            setPaletteOpen(true);
            onNavigate?.();
          }}
          className="flex h-9 w-full items-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--raise)] px-3 text-[13px] text-[var(--faint)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--muted)] cursor-pointer"
        >
          <IcSearch size={14} />
          <span className="flex-1 text-left">Search or command…</span>
          <span className="flex gap-0.5"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
        <NavLink
          to="/app"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium transition-colors',
              isActive ? 'bg-[var(--teal-soft)] text-[var(--teal)]' : 'text-[var(--muted)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]',
            )
          }
        >
          <IcGrid size={16} /> Dashboard
        </NavLink>

        <p className="px-2.5 pb-1 pt-5 font-data text-[10px] font-medium uppercase tracking-widest text-[var(--faint)]">
          Decision spaces
        </p>
        {decisions.map((d) => {
          const dd = d.deadline ? daysUntil(d.deadline) : null;
          return (
            <NavLink
              key={d.id}
              to={`/app/decision/${d.id}/canvas`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] transition-colors',
                  isActive
                    ? 'bg-[var(--sunken)] font-semibold text-[var(--ink)]'
                    : 'text-[var(--muted)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]',
                )
              }
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_DOT[d.status] }} />
              <span className="min-w-0 flex-1 truncate">{d.title}</span>
              {dd !== null && dd >= 0 && dd <= 7 && d.status !== 'decided' && (
                <Badge tone={dd <= 3 ? 'coral' : 'amber'}>{dd === 0 ? 'today' : `${dd}d`}</Badge>
              )}
            </NavLink>
          );
        })}
        <button
          onClick={() => {
            nav('/app?new=1');
            onNavigate?.();
          }}
          className="mt-1 flex w-full items-center gap-2.5 rounded-[10px] border border-dashed border-[var(--line-strong)] px-2.5 py-2 text-[13px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)] cursor-pointer"
        >
          <IcPlus size={15} /> New decision
        </button>
      </nav>

      <div className="border-t border-[var(--line)] p-3">
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--teal-soft)] font-display text-[12px] font-bold text-[var(--teal)]">
            AR
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-tight">Alex Rivera</span>
            <span className="block font-data text-[10px] text-[var(--faint)]">personal workspace</span>
          </span>
          <IconBtn label="Toggle theme" onClick={toggleTheme}>
            {theme === 'dark' ? <IcSun size={15} /> : <IcMoon size={15} />}
          </IconBtn>
          <IconBtn label="Settings" onClick={() => setSettingsOpen(true)}>
            <IcSettings size={15} />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- shell -------------------------------- */

export function AppShell() {
  const loc = useLocation();
  const decisions = useStore((s) => s.decisions);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const [drawer, setDrawer] = useState(false);
  const [pending, setPending] = useState(false);

  const activeId = useMemo(() => loc.pathname.match(/^\/app\/decision\/([^/]+)/)?.[1], [loc.pathname]);
  const active = decisions.find((d) => d.id === activeId);

  // brief skeleton on route change → perceived structure, no jarring pops
  useEffect(() => {
    setPending(true);
    const t = setTimeout(() => setPending(false), 320);
    return () => clearTimeout(t);
  }, [loc.pathname]);

  const crumb = active ? active.title : 'Dashboard';

  return (
    <div className="min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-[var(--line)] bg-[var(--surface)] lg:block">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setDrawer(false)} />
          <div className="anim-fade-up absolute inset-y-0 left-0 w-[280px] border-r border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
            <button
              onClick={() => setDrawer(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--sunken)] cursor-pointer"
              aria-label="Close menu"
            >
              <IcX size={16} />
            </button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--line)] bg-[var(--bg)]/85 px-3 backdrop-blur-md sm:px-5">
          <IconBtn label="Open menu" className="lg:hidden" onClick={() => setDrawer(true)}>
            <IcMenu size={17} />
          </IconBtn>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden font-data text-[11px] text-[var(--faint)] sm:block">nexus /</span>
            <h1 className="truncate font-display text-[14.5px] font-semibold">{crumb}</h1>
            {active && active.status !== 'decided' && (
              <span className="hidden sm:block">
                <Badge tone="neutral" className="capitalize">{active.status}</Badge>
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden h-8 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] text-[var(--faint)] transition-colors hover:border-[var(--line-strong)] md:flex cursor-pointer"
            >
              <IcSearch size={13} /> Search <span className="flex gap-0.5"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
            </button>
            <IconBtn label="Search" className="md:hidden" onClick={() => setPaletteOpen(true)}>
              <IcSearch size={16} />
            </IconBtn>
            <NotificationsBell />
          </div>
        </header>

        <main className="mx-auto max-w-[1240px] px-3 py-5 sm:px-5 sm:py-7">
          {pending ? <ShellSkeleton /> : <Outlet />}
        </main>
      </div>

      <SettingsModal />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="anim-fade-up space-y-5" aria-label="Loading" role="status">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}
