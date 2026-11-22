import React from 'react';
import { Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AmountError from '@/components/grants/detail/financials/AmountError';
import { scheduleCheck, AMOUNT_ERROR } from '@/lib/contractRegister';
import { cn } from '@/lib/utils';

const BLANK = { label: '', amount: '' };
const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US')}`;
export const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

/** Whole-number amount input with a "$" adornment; `large` is the Contract Value box. */
export function MoneyInput({ value, onChange, large }) {
  const display = value === '' || value == null ? '' : Number(value).toLocaleString('en-US');
  const change = (e) => { const d = e.target.value.replace(/[^0-9]/g, ''); onChange(d === '' ? '' : Number(d)); };
  if (large) return (
    <div className="flex h-[82px] rounded-xl border border-border bg-card overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      <span className="w-12 flex items-center justify-center border-r border-border bg-muted/50 text-muted-foreground">$</span>
      <input inputMode="numeric" value={display} onChange={change} placeholder="0"
        className="flex-1 min-w-0 px-4 bg-transparent text-xl font-semibold text-foreground outline-none tabular-nums" />
    </div>
  );
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <Input inputMode="numeric" value={display} onChange={change} className="h-11 pl-7 text-sm bg-card tabular-nums" />
    </div>
  );
}

/** Contract Value input — auto-fills the first schedule row while no amounts exist (Grant behaviour). */
function Total({ values, update }) {
  const { parsedTotal, hasBreakdown } = scheduleCheck(values);
  const rows = values.payment_schedule || [];
  const change = (val) => update(hasBreakdown ? { value: val }
    : { value: val, payment_schedule: [{ ...(rows[0] || BLANK), amount: val }, ...rows.slice(1)] });
  return (
    <>
      <MoneyInput large value={values.value} onChange={change} />
      {parsedTotal === null && <AmountError message={AMOUNT_ERROR} />}
    </>
  );
}

/** Period / amount table with allocation progress — mirrors the Grant Funding Schedule rules. */
export default function PaymentScheduleEditor({ values, update }) {
  const rows = values.payment_schedule || [];
  const { parsedRows, hasInvalid, total, scheduleTotal, diff, matches } = scheduleCheck(values);
  const setRows = (next) => update({ payment_schedule: next });
  const updateRow = (i, k, v) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const remove = (i) => { const next = rows.filter((_, idx) => idx !== i); setRows(next.length ? next : [BLANK]); };
  const pct = total > 0 ? Math.min(100, (scheduleTotal / total) * 100) : 0;
  const ok = !hasInvalid && total > 0 && matches;

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_40px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
          <span>Period</span><span>Amount</span><span />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-3 items-start px-4 py-3 border-b border-border">
            <Input value={row.label} onChange={(e) => updateRow(i, 'label', e.target.value)} placeholder="e.g. Year 1, Q2 2026" className="h-11 text-sm bg-card" />
            <div>
              <MoneyInput value={row.amount} onChange={(v) => updateRow(i, 'amount', v)} />
              {parsedRows[i] === null && <AmountError message={AMOUNT_ERROR} />}
            </div>
            {rows.length > 1 && (
              <button type="button" onClick={() => remove(i)} title="Remove period"
                className="h-11 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setRows([...rows, BLANK])}
          className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-primary hover:underline">
          <Plus className="w-4 h-4" /> Add payment period
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-muted/50 p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">Total scheduled</span>
          <span><span className="text-lg font-bold text-foreground tabular-nums">{fmt(scheduleTotal)}</span>
            <span className="text-sm text-muted-foreground"> of {fmt(total)}</span></span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-300', ok ? 'bg-green-500' : diff < 0 ? 'bg-destructive' : 'bg-primary')} style={{ width: `${pct}%` }} />
        </div>
        {!hasInvalid && total > 0 && (
          ok ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" /> Schedule matches the contract value
            </p>
          ) : diff > 0 ? (
            <p className="mt-3 text-sm text-overdue">{fmt(diff)} left to allocate</p>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" /> Over-allocated by {fmt(-diff)}
            </p>
          )
        )}
      </div>
    </>
  );
}

PaymentScheduleEditor.Total = Total;