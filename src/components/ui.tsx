import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../lib/engine';
import { useStore } from '../store';
import { IcAlert, IcCheck, IcInfo, IcX } from './icons';

/* ------------------------------- Button ------------------------------- */

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  const v: Record<BtnVariant, string> = {
    primary:
      'bg-[var(--teal)] text-[var(--bg)] hover:brightness-110 active:scale-[0.98] font-semibold shadow-[var(--shadow-sm)]',
    outline:
      'border border-[var(--line-strong)] text-[var(--ink)] hover:bg-[var(--sunken)] active:scale-[0.98]',
    ghost: 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] active:scale-[0.98]',
    danger:
      'bg-[var(--coral-soft)] text-[var(--coral)] hover:brightness-105 active:scale-[0.98] font-semibold',
    soft: 'bg-[var(--teal-soft)] text-[var(--teal)] hover:brightness-105 active:scale-[0.98] font-semibold',
  };
  const s = {
    sm: 'h-7 px-2.5 text-[12.5px] gap-1.5 rounded-lg',
    md: 'h-9 px-3.5 text-[13.5px] gap-2 rounded-[10px]',
    lg: 'h-11 px-5 text-[14.5px] gap-2 rounded-xl',
  }[size];
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 disabled:opacity-45 disabled:pointer-events-none cursor-pointer select-none',
        v[variant],
        s,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconBtn({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-all duration-150 hover:bg-[var(--sunken)] hover:text-[var(--ink)] active:scale-95 cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------- Badge ------------------------------- */

export type Tone = 'teal' | 'amber' | 'coral' | 'blue' | 'neutral';

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  const t: Record<Tone, string> = {
    teal: 'bg-[var(--teal-soft)] text-[var(--teal)]',
    amber: 'bg-[var(--amber-soft)] text-[var(--amber)]',
    coral: 'bg-[var(--coral-soft)] text-[var(--coral)]',
    blue: 'bg-[var(--blue-soft)] text-[var(--blue)]',
    neutral: 'bg-[var(--sunken)] text-[var(--muted)]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-data text-[11px] font-medium leading-4 whitespace-nowrap',
        t[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    exploring: { tone: 'blue', label: 'Exploring' },
    modeling: { tone: 'amber', label: 'Modeling' },
    reviewing: { tone: 'coral', label: 'Reviewing' },
    decided: { tone: 'teal', label: 'Decided' },
  };
  const m = map[status] ?? map.exploring;
  return (
    <Badge tone={m.tone}>
      <span className={cn('h-1.5 w-1.5 rounded-full bg-current', status !== 'decided' && 'anim-pulse-dot')} />
      {m.label}
    </Badge>
  );
}

/* ------------------------------- Inputs ------------------------------- */

const fieldCls =
  'w-full rounded-[10px] border border-[var(--line)] bg-[var(--raise)] px-3 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--faint)] transition-colors focus:border-[var(--teal)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldCls, 'h-9', className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldCls, 'py-2 leading-relaxed resize-y min-h-20', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldCls, 'h-9 appearance-none pr-8 cursor-pointer bg-no-repeat bg-[right_10px_center] bg-[length:14px]', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="mb-1.5 flex items-baseline justify-between text-[12px] font-semibold tracking-wide text-[var(--muted)] uppercase">
      <span>{children}</span>
      {hint && <span className="font-data normal-case font-normal text-[var(--faint)]">{hint}</span>}
    </label>
  );
}

/* ----------------------------- Range slider --------------------------- */

export function RangeSlider({
  value,
  min = 0,
  max = 10,
  step = 1,
  tone = 'teal',
  onChange,
  ariaLabel,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  tone?: 'teal' | 'amber';
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className={cn('nx-range', tone === 'amber' && 'amber')}
      style={{ ['--fill' as string]: `${pct}%` }}
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/* -------------------------------- Modal ------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'anim-pop relative w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)]',
          wide ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
          <h2 className="font-display text-[15px] font-semibold">{title}</h2>
          <IconBtn label="Close" onClick={onClose}>
            <IcX size={16} />
          </IconBtn>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Delete',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* -------------------------------- Tabs -------------------------------- */

export function Tabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: { id: T; label: string; icon?: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-0.5 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--sunken)] p-1" role="tablist">
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={active === it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 cursor-pointer',
            active === it.id
              ? 'bg-[var(--raise)] text-[var(--ink)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--muted)] hover:text-[var(--ink)]',
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- Dropdown ----------------------------- */

export function Menu({
  trigger,
  items,
  align = 'right',
}: {
  trigger: ReactNode;
  items: { label: string; icon?: ReactNode; danger?: boolean; onClick: () => void }[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'anim-pop absolute z-50 mt-1.5 min-w-44 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-[var(--shadow-md)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
        >
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors cursor-pointer',
                it.danger
                  ? 'text-[var(--coral)] hover:bg-[var(--coral-soft)]'
                  : 'text-[var(--ink)] hover:bg-[var(--sunken)]',
              )}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ EmptyState ---------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sunken)] text-[var(--muted)]">
        {icon}
      </div>
      <h3 className="font-display text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--muted)]">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-[var(--line-strong)] bg-[var(--sunken)] px-1.5 font-data text-[10.5px] font-medium text-[var(--muted)]">
      {children}
    </kbd>
  );
}

/* -------------------------------- Meter ------------------------------- */

export function Meter({
  value,
  color = 'var(--teal)',
  className,
}: {
  value: number; // 0..100
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[var(--sunken)]', className)}>
      <div
        className="bar-anim h-full rounded-full"
        style={{ width: `${Math.max(2, value)}%`, background: color }}
      />
    </div>
  );
}

/* -------------------------------- Toasts ------------------------------ */

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'anim-pop pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-[var(--shadow-md)] backdrop-blur-sm',
            'border-[var(--line)] bg-[var(--surface)]/95',
          )}
          role="status"
        >
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
              t.kind === 'success' && 'bg-[var(--teal-soft)] text-[var(--teal)]',
              t.kind === 'info' && 'bg-[var(--blue-soft)] text-[var(--blue)]',
              t.kind === 'error' && 'bg-[var(--coral-soft)] text-[var(--coral)]',
            )}
          >
            {t.kind === 'error' ? <IcAlert size={11} /> : t.kind === 'info' ? <IcInfo size={11} /> : <IcCheck size={11} />}
          </span>
          <p className="flex-1 text-[13px] font-medium leading-snug">{t.message}</p>
          <IconBtn label="Dismiss" className="h-6 w-6" onClick={() => dismiss(t.id)}>
            <IcX size={13} />
          </IconBtn>
        </div>
      ))}
    </div>
  );
}
