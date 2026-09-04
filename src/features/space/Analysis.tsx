import { useMemo } from 'react';
import type { Decision } from '../../types';
import { normalizedWeights, scoreColor, type ModelResult } from '../../lib/engine';
import { Badge, EmptyState } from '../../components/ui';
import { Gauge, Radar, RankBars, RiskMatrix, WeightStrip } from '../../components/charts';
import { IcAlert, IcChart, IcCheck, IcShield, IcSpark, IcX } from '../../components/icons';

export default function Analysis({ d, model }: { d: Decision; model: ModelResult }) {
  const weights = useMemo(() => normalizedWeights(d.criteria), [d.criteria]);

  if (d.options.length === 0 || d.criteria.length === 0) {
    return (
      <EmptyState
        icon={<IcChart size={20} />}
        title="Not enough model to analyze"
        body="Analysis needs at least one option and one criterion. Build the model on the Canvas, then come back for the verdict."
      />
    );
  }

  const winner = model.winner!;
  const radarSeries = model.rows.map((r) => ({
    name: r.option.name,
    color: r.option.color,
    values: d.criteria.map((c) => r.option.scores[c.id] ?? 0),
  }));

  const uncertainties: string[] = [];
  const lowRel = d.evidence.filter((e) => e.reliability === 'low').length;
  if (model.margin < 4 && model.runnerUp)
    uncertainties.push(`Margin of ${model.margin.toFixed(1)} pts between the top two — within the noise of any 0–10 scoring.`);
  if (lowRel > 0) uncertainties.push(`${lowRel} evidence ${lowRel === 1 ? 'item has' : 'items have'} low reliability — treat their signal as a rumor.`);
  const contra = d.evidence.filter((e) => e.stance === 'contradicting');
  if (contra.length) uncertainties.push(`${contra.length} contradicting ${contra.length === 1 ? 'signal' : 'signals'} on the table: ${contra.slice(0, 2).map((e) => `“${e.title}”`).join(', ')}.`);
  const heavy = d.risks.filter((r) => r.probability * r.impact >= 12);
  if (heavy.length) uncertainties.push(`${heavy.length} high-load ${heavy.length === 1 ? 'risk' : 'risks'} (P×I ≥ 12) ${heavy.length === 1 ? 'is' : 'are'} still open — mitigation quality is untested.`);
  const blind = d.options.filter((o) => !o.eliminated && !d.evidence.some((e) => e.optionId === o.id));
  if (blind.length) uncertainties.push(`No evidence attached to: ${blind.map((o) => o.name).join(', ')} — scoring is pure intuition there.`);
  if (d.evidence.length === 0) uncertainties.push('Zero evidence items — the entire model is self-reported. Confidence should be read accordingly.');

  return (
    <div className="anim-fade-up space-y-5">
      {/* recommendation banner */}
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-center sm:p-6">
          <div>
            <p className="font-data text-[10.5px] font-semibold uppercase tracking-widest text-[var(--faint)]">overall recommendation</p>
            <h2 className="font-display mt-1.5 flex items-center gap-3 text-[clamp(22px,3vw,30px)] font-bold tracking-tight">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: winner.option.color }} />
              {winner.option.name} appears to be the strongest choice.
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[var(--muted)]">
              {model.runnerUp
                ? `It scores ${winner.adjusted.toFixed(1)} pts risk-adjusted, ${model.margin.toFixed(1)} ahead of ${model.runnerUp.option.name} (${model.runnerUp.adjusted.toFixed(1)}). That verdict is derived entirely from your weights, scores and mapped risks — change any of them and it re-derives.`
                : `It scores ${winner.adjusted.toFixed(1)} pts as the only live option. Add another path to test it against.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="teal">raw {winner.raw.toFixed(1)}</Badge>
              <Badge tone={winner.penalty > 6 ? 'coral' : winner.penalty > 2 ? 'amber' : 'neutral'}>risk −{winner.penalty.toFixed(1)}</Badge>
              <Badge tone={model.riskLevel === 'high' ? 'coral' : model.riskLevel === 'medium' ? 'amber' : 'teal'}>portfolio risk: {model.riskLevel}</Badge>
              <Badge tone="neutral">{d.evidence.length} evidence</Badge>
              <Badge tone="neutral">{d.risks.length} risks</Badge>
            </div>
          </div>
          <div className="flex items-center gap-6 justify-self-center md:justify-self-end">
            <Gauge value={model.confidence} label="confidence" size={132} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* radar */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="font-display text-[14.5px] font-semibold">Criteria profile</h3>
          <p className="text-[12px] text-[var(--muted)]">Each option's raw shape across your criteria (0–10).</p>
          <div className="mx-auto mt-3 max-w-95">
            <Radar axes={d.criteria.map((c) => c.name)} series={radarSeries} />
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {model.rows.map((r) => (
              <span key={r.option.id} className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full" style={{ background: r.option.color }} /> {r.option.name}
              </span>
            ))}
          </div>
        </section>

        {/* ranking + breakdown */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="font-display text-[14.5px] font-semibold">Risk-adjusted ranking</h3>
          <p className="text-[12px] text-[var(--muted)]">Weighted score minus the risk penalty.</p>
          <div className="mt-4">
            <RankBars rows={model.rows.map((r) => ({ id: r.option.id, label: r.option.name, color: r.option.color, value: r.adjusted }))} />
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-[var(--line)]">
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--sunken)]/70 font-data text-[10px] uppercase tracking-wider text-[var(--faint)]">
                <tr>
                  <th className="px-3 py-2 text-left">option</th>
                  <th className="px-3 py-2 text-right">raw</th>
                  <th className="px-3 py-2 text-right">risk</th>
                  <th className="px-3 py-2 text-right">adjusted</th>
                </tr>
              </thead>
              <tbody>
                {model.rows.map((r) => (
                  <tr key={r.option.id} className="border-t border-[var(--line)]">
                    <td className="flex items-center gap-2 px-3 py-2 font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.option.color }} /> {r.option.name}
                    </td>
                    <td className="px-3 py-2 text-right font-data">{r.raw.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right font-data text-[var(--coral)]">−{r.penalty.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right font-data font-semibold" style={{ color: scoreColor(r.adjusted) }}>{r.adjusted.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* weights */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="font-display text-[14.5px] font-semibold">What you're weighting</h3>
          <p className="text-[12px] text-[var(--muted)]">
            {model.topDriver
              ? `${model.topDriver.name} dominates at ${Math.round((weights[model.topDriver.id] ?? 0) * 100)}% — the recommendation bends most when it moves.`
              : 'No criteria yet.'}
          </p>
          <div className="mt-4">
            <WeightStrip criteria={d.criteria} weights={weights} />
          </div>
        </section>

        {/* risk matrix */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
          <h3 className="font-display text-[14.5px] font-semibold">Risk landscape</h3>
          <p className="text-[12px] text-[var(--muted)]">Dots are colored by the option they threaten.</p>
          <div className="mt-4">
            {d.risks.length ? (
              <RiskMatrix risks={d.risks} colorFor={(oid) => d.options.find((o) => o.id === oid)?.color ?? 'var(--coral)'} />
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--sunken)] px-4 py-6 text-[13px] text-[var(--muted)]">
                <IcShield size={16} /> No risks mapped — the penalty column stays at zero for everyone.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* strengths & weaknesses */}
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="font-display text-[14.5px] font-semibold">Strengths & weaknesses by option</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {model.rows.map((r) => (
            <div key={r.option.id} className="rounded-xl border border-[var(--line)] p-4">
              <p className="flex items-center gap-2 font-display text-[13.5px] font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.option.color }} />
                {r.option.name}
                <span className="ml-auto font-data text-[10.5px] text-[var(--faint)]">#{r.rank}</span>
              </p>
              <ul className="mt-3 space-y-1.5">
                {r.strengths.map((s) => (
                  <li key={s.criterion.id} className="flex items-center gap-2 text-[12.5px]">
                    <IcCheck size={13} className="shrink-0 text-[var(--teal)]" />
                    <span className="flex-1 truncate">{s.criterion.name}</span>
                    <span className="font-data text-[11px] text-[var(--teal)]">+{s.pts.toFixed(1)} pts</span>
                  </li>
                ))}
                {r.weaknesses.map((w) => (
                  <li key={w.criterion.id} className="flex items-center gap-2 text-[12.5px]">
                    <IcX size={13} className="shrink-0 text-[var(--coral)]" />
                    <span className="flex-1 truncate">{w.criterion.name}</span>
                    <span className="font-data text-[11px] text-[var(--faint)]">{w.score}/10</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* uncertainties */}
      <section className="rounded-2xl border border-[var(--amber)]/40 bg-[var(--amber-soft)]/30 p-5">
        <h3 className="font-display flex items-center gap-2 text-[14.5px] font-semibold">
          <IcAlert size={16} className="text-[var(--amber)]" /> Major uncertainties
        </h3>
        {uncertainties.length === 0 ? (
          <p className="mt-2 text-[13.5px] text-[var(--muted)]">
            Remarkably few open questions — wide margins, solid evidence, mitigated risks. Either you're ready, or you're not looking hard enough.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {uncertainties.map((u, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-[var(--ink)]">
                <IcSpark size={14} className="mt-0.5 shrink-0 text-[var(--amber)]" />
                {u}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="font-data text-[10.5px] leading-relaxed text-[var(--faint)]">
        Model assumptions: criteria weights normalized to 100% · option scores on a 0–10 self-reported scale · risk penalty = Σ(P×I)/25 × 9, capped at 22 pts ·
        confidence = 52% gut + 28% evidence + 20% margin. This is your model, not an oracle.
      </p>
    </div>
  );
}
