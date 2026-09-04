import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppNotification,
  Criterion,
  Decision,
  EvidenceItem,
  JournalEntry,
  Option,
  Overrides,
  RiskItem,
  Scenario,
  Theme,
  TimelineType,
  ToastItem,
} from './types';
import { nextOptionColor, nowIso, uid } from './lib/engine';
import { seedDecisions, seedNotifications } from './data/demo';

interface AppState {
  theme: Theme;
  decisions: Decision[];
  notifications: AppNotification[];
  recentSearches: string[];
  // transient UI state (not persisted)
  toasts: ToastItem[];
  paletteOpen: boolean;
  settingsOpen: boolean;

  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toast: (message: string, kind?: ToastItem['kind']) => void;
  dismissToast: (id: string) => void;
  setPaletteOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  addRecentSearch: (q: string) => void;

  createDecision: (input: { title: string; question: string; category: Decision['category']; timeHorizon: string; deadline?: string }) => string;
  updateDecision: (id: string, patch: Partial<Decision>) => void;
  deleteDecision: (id: string) => void;
  resetDemo: () => void;

  addOption: (decisionId: string, name: string, description?: string) => void;
  updateOption: (decisionId: string, optionId: string, patch: Partial<Option>) => void;
  removeOption: (decisionId: string, optionId: string) => void;
  moveOption: (decisionId: string, optionId: string, dir: -1 | 1) => void;

  addCriterion: (decisionId: string, name: string, weight?: number) => void;
  updateCriterion: (decisionId: string, criterionId: string, patch: Partial<Criterion>) => void;
  removeCriterion: (decisionId: string, criterionId: string) => void;
  moveCriterion: (decisionId: string, criterionId: string, dir: -1 | 1) => void;
  setScore: (decisionId: string, optionId: string, criterionId: string, value: number) => void;

  addEvidence: (decisionId: string, item: Omit<EvidenceItem, 'id' | 'date'>) => void;
  removeEvidence: (decisionId: string, evidenceId: string) => void;
  addRisk: (decisionId: string, item: Omit<RiskItem, 'id'>) => void;
  updateRisk: (decisionId: string, riskId: string, patch: Partial<RiskItem>) => void;
  removeRisk: (decisionId: string, riskId: string) => void;

  addScenario: (decisionId: string, s: Omit<Scenario, 'id'>) => void;
  removeScenario: (decisionId: string, scenarioId: string) => void;
  addJournal: (decisionId: string, e: Omit<JournalEntry, 'id' | 'date'>) => void;

  setStatus: (decisionId: string, status: Decision['status']) => void;

  markRead: (id: string) => void;
  markAllRead: () => void;
}

const EVENT_LABELS: Record<TimelineType, string> = {
  created: 'Decision space created',
  options: 'Options updated',
  criteria: 'Criteria updated',
  evidence: 'Evidence added',
  risk: 'Risk mapped',
  model: 'Model updated',
  scenario: 'Scenario saved',
  journal: 'Journal entry logged',
  decided: 'Decision made',
};

function withTimeline(d: Decision, type: TimelineType, label?: string, detail?: string): Decision {
  return {
    ...d,
    updatedAt: nowIso(),
    timeline: [
      ...d.timeline,
      { id: uid(), type, label: label ?? EVENT_LABELS[type], date: nowIso(), detail },
    ],
  };
}

function mutate(
  state: AppState,
  id: string,
  fn: (d: Decision) => Decision,
): Partial<AppState> {
  return {
    decisions: state.decisions.map((d) => (d.id === id ? { ...fn(d), updatedAt: nowIso() } : d)),
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme:
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light',
      decisions: seedDecisions(),
      notifications: seedNotifications(),
      recentSearches: [],
      toasts: [],
      paletteOpen: false,
      settingsOpen: false,

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      toast: (message, kind = 'success') => {
        const id = uid();
        set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, kind }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 3800);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      setPaletteOpen: (v) => set({ paletteOpen: v }),
      setSettingsOpen: (v) => set({ settingsOpen: v }),
      addRecentSearch: (q) =>
        set((s) => ({
          recentSearches: [q, ...s.recentSearches.filter((r) => r !== q)].slice(0, 6),
        })),

      createDecision: (input) => {
        const id = uid();
        const d: Decision = {
          id,
          title: input.title,
          question: input.question || input.title,
          category: input.category,
          status: 'exploring',
          timeHorizon: input.timeHorizon || 'Undecided',
          deadline: input.deadline,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          baseConfidence: 30,
          dependencies: [],
          expectedOutcomes: [],
          options: [],
          criteria: [],
          evidence: [],
          risks: [],
          scenarios: [],
          journal: [],
          timeline: [{ id: uid(), type: 'created', label: 'Decision space created', date: nowIso() }],
        };
        set((s) => ({ decisions: [d, ...s.decisions] }));
        get().toast('Decision space created');
        return id;
      },

      updateDecision: (id, patch) => set((s) => mutate(s, id, (d) => ({ ...d, ...patch }))),

      deleteDecision: (id) => {
        set((s) => ({ decisions: s.decisions.filter((d) => d.id !== id) }));
        get().toast('Decision deleted', 'info');
      },

      resetDemo: () => {
        set({ decisions: seedDecisions(), notifications: seedNotifications() });
        get().toast('Demo data restored', 'info');
      },

      addOption: (decisionId, name, description) =>
        set((s) =>
          mutate(s, decisionId, (d) =>
            withTimeline(
              {
                ...d,
                options: [
                  ...d.options,
                  {
                    id: uid(),
                    name,
                    description,
                    color: nextOptionColor(d),
                    scores: Object.fromEntries(d.criteria.map((c) => [c.id, 5])),
                  },
                ],
              },
              'options',
              `Option “${name}” added`,
            ),
          ),
        ),

      updateOption: (decisionId, optionId, patch) =>
        set((s) =>
          mutate(s, decisionId, (d) => ({
            ...d,
            options: d.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
          })),
        ),

      removeOption: (decisionId, optionId) => {
        const d = get().decisions.find((x) => x.id === decisionId);
        const name = d?.options.find((o) => o.id === optionId)?.name;
        set((s) =>
          mutate(s, decisionId, (dd) =>
            withTimeline(
              {
                ...dd,
                options: dd.options.filter((o) => o.id !== optionId),
                evidence: dd.evidence.filter((e) => e.optionId !== optionId),
                risks: dd.risks.filter((r) => r.optionId !== optionId),
              },
              'options',
              `Option “${name ?? ''}” removed`,
            ),
          ),
        );
        get().toast(`Option removed`, 'info');
      },

      moveOption: (decisionId, optionId, dir) =>
        set((s) =>
          mutate(s, decisionId, (d) => {
            const i = d.options.findIndex((o) => o.id === optionId);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= d.options.length) return d;
            const opts = [...d.options];
            const [o] = opts.splice(i, 1);
            opts.splice(j, 0, o);
            return { ...d, options: opts };
          }),
        ),

      addCriterion: (decisionId, name, weight = 10) =>
        set((s) =>
          mutate(s, decisionId, (d) => {
            const c: Criterion = { id: uid(), name, weight };
            return withTimeline(
              {
                ...d,
                criteria: [...d.criteria, c],
                options: d.options.map((o) => ({ ...o, scores: { ...o.scores, [c.id]: 5 } })),
              },
              'criteria',
              `Criterion “${name}” added`,
            );
          }),
        ),

      updateCriterion: (decisionId, criterionId, patch) =>
        set((s) =>
          mutate(s, decisionId, (d) => ({
            ...d,
            criteria: d.criteria.map((c) => (c.id === criterionId ? { ...c, ...patch } : c)),
          })),
        ),

      removeCriterion: (decisionId, criterionId) => {
        set((s) =>
          mutate(s, decisionId, (d) =>
            withTimeline(
              {
                ...d,
                criteria: d.criteria.filter((c) => c.id !== criterionId),
                options: d.options.map((o) => {
                  const scores = { ...o.scores };
                  delete scores[criterionId];
                  return { ...o, scores };
                }),
              },
              'criteria',
              'Criterion removed',
            ),
          ),
        );
        get().toast('Criterion removed', 'info');
      },

      moveCriterion: (decisionId, criterionId, dir) =>
        set((s) =>
          mutate(s, decisionId, (d) => {
            const i = d.criteria.findIndex((c) => c.id === criterionId);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= d.criteria.length) return d;
            const cs = [...d.criteria];
            const [c] = cs.splice(i, 1);
            cs.splice(j, 0, c);
            return { ...d, criteria: cs };
          }),
        ),

      setScore: (decisionId, optionId, criterionId, value) =>
        set((s) =>
          mutate(s, decisionId, (d) => ({
            ...d,
            options: d.options.map((o) =>
              o.id === optionId ? { ...o, scores: { ...o.scores, [criterionId]: value } } : o,
            ),
          })),
        ),

      addEvidence: (decisionId, item) =>
        set((s) =>
          mutate(s, decisionId, (d) =>
            withTimeline(
              { ...d, evidence: [{ ...item, id: uid(), date: nowIso() }, ...d.evidence] },
              'evidence',
              `Evidence “${item.title}” added`,
            ),
          ),
        ),

      removeEvidence: (decisionId, evidenceId) => {
        set((s) =>
          mutate(s, decisionId, (d) => ({
            ...d,
            evidence: d.evidence.filter((e) => e.id !== evidenceId),
          })),
        );
        get().toast('Evidence removed', 'info');
      },

      addRisk: (decisionId, item) =>
        set((s) =>
          mutate(s, decisionId, (d) =>
            withTimeline(
              { ...d, risks: [{ ...item, id: uid() }, ...d.risks] },
              'risk',
              `Risk “${item.name}” mapped`,
            ),
          ),
        ),

      updateRisk: (decisionId, riskId, patch) =>
        set((s) =>
          mutate(s, decisionId, (d) => ({
            ...d,
            risks: d.risks.map((r) => (r.id === riskId ? { ...r, ...patch } : r)),
          })),
        ),

      removeRisk: (decisionId, riskId) => {
        set((s) =>
          mutate(s, decisionId, (d) => ({
            ...d,
            risks: d.risks.filter((r) => r.id !== riskId),
          })),
        );
        get().toast('Risk removed', 'info');
      },

      addScenario: (decisionId, sc) =>
        set((s) =>
          mutate(s, decisionId, (d) =>
            withTimeline(
              { ...d, scenarios: [...d.scenarios, { ...sc, id: uid() }] },
              'scenario',
              `Scenario “${sc.name}” saved`,
              sc.note,
            ),
          ),
        ),

      removeScenario: (decisionId, scenarioId) => {
        set((s) =>
          mutate(s, decisionId, (d) => ({
            ...d,
            scenarios: d.scenarios.filter((sc) => sc.id !== scenarioId),
          })),
        );
        get().toast('Scenario removed', 'info');
      },

      addJournal: (decisionId, e) =>
        set((s) =>
          mutate(s, decisionId, (d) =>
            withTimeline(
              { ...d, journal: [{ ...e, id: uid(), date: nowIso() }, ...d.journal] },
              'journal',
              `Journal — “${e.title}”`,
            ),
          ),
        ),

      setStatus: (decisionId, status) => {
        set((s) =>
          mutate(s, decisionId, (d) =>
            status === 'decided'
              ? withTimeline({ ...d, status }, 'decided', 'Decision made')
              : { ...d, status },
          ),
        );
        if (status === 'decided') get().toast('Decision marked as made — nice work');
      },

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: 'nexus-store',
      version: 1,
      partialize: (s) => ({
        theme: s.theme,
        decisions: s.decisions,
        notifications: s.notifications,
        recentSearches: s.recentSearches,
      }),
    },
  ),
);

/* convenience selectors */
export const useDecision = (id: string | undefined): Decision | undefined =>
  useStore((s) => s.decisions.find((d) => d.id === id));

export type { Overrides };
