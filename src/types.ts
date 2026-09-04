export type Theme = 'dark' | 'light';

export type DecisionStatus = 'exploring' | 'modeling' | 'reviewing' | 'decided';
export type Category = 'career' | 'finance' | 'tech' | 'life' | 'travel';
export type Stance = 'supporting' | 'contradicting' | 'neutral';
export type Reliability = 'high' | 'medium' | 'low';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Criterion {
  id: string;
  name: string;
  weight: number; // raw weight 0..100
  note?: string;
}

export interface Option {
  id: string;
  name: string;
  description?: string;
  color: string;
  cost?: number;
  eliminated?: boolean;
  scores: Record<string, number>; // criterionId -> 0..10
}

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  source: string;
  reliability: Reliability;
  date: string;
  stance: Stance;
  optionId?: string;
  criterionId?: string;
}

export interface RiskItem {
  id: string;
  name: string;
  probability: number; // 1..5
  impact: number; // 1..5
  mitigation: string;
  optionId?: string;
}

export interface Scenario {
  id: string;
  name: string;
  note?: string;
  weightOverrides: Record<string, number>; // criterionId -> raw weight
  scoreOverrides: Record<string, Record<string, number>>; // optionId -> criterionId -> score
}

export type JournalKind = 'why' | 'expectation' | 'outcome';

export interface JournalEntry {
  id: string;
  kind: JournalKind;
  title: string;
  body: string;
  date: string;
}

export type TimelineType =
  | 'created'
  | 'options'
  | 'criteria'
  | 'evidence'
  | 'risk'
  | 'model'
  | 'scenario'
  | 'journal'
  | 'decided';

export interface TimelineEvent {
  id: string;
  type: TimelineType;
  label: string;
  date: string;
  detail?: string;
}

export interface Decision {
  id: string;
  title: string;
  question: string;
  category: Category;
  status: DecisionStatus;
  timeHorizon: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  baseConfidence: number; // user's gut confidence 0..100
  dependencies: string[];
  expectedOutcomes: string[];
  options: Option[];
  criteria: Criterion[];
  evidence: EvidenceItem[];
  risks: RiskItem[];
  scenarios: Scenario[];
  journal: JournalEntry[];
  timeline: TimelineEvent[];
}

export type NotificationKind = 'review' | 'evidence' | 'scenario' | 'confidence' | 'reminder';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  date: string;
  read: boolean;
  decisionId?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  kind: 'success' | 'info' | 'error';
}

/** What-If / scenario overrides layered on top of a decision's base model. */
export interface Overrides {
  weights?: Record<string, number>;
  scores?: Record<string, Record<string, number>>;
  riskMultiplier?: number;
}
