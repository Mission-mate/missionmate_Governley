import React from 'react';
import { DollarSign, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CurrencyInput from '@/components/grants/detail/financials/CurrencyInput';
import AmountError from '@/components/grants/detail/financials/AmountError';
import { parseAmount } from '@/lib/financials';

const AMOUNT_ERROR = 'Enter a valid amount — numbers only, zero or greater.';

export default function GrantStepFinancials({ form, update }) {
  const rows = form.funding_rows || [];
  // Numeric validation first; the mismatch check below only runs once every
  // amount is a finite, non-negative number.
  const parsedTotal = parseAmount(form.total_amount);
  const parsedRows = rows.map(r => parseAmount(r.amount));
  const hasInvalidAmounts = parsedTotal === null || parsedRows.some(a => a === null);

  const totalGrant = parsedTotal ?? 0;
  const breakdownTotal = parsedRows.reduce((sum, a) => sum + (a ?? 0), 0);
  const hasBreakdown = parsedRows.some(a => (a ?? 0) > 0);
  const diff = totalGrant - breakdownTotal;
  const matches = !totalGrant || Math.abs(diff) < 0.005;

  // When the total grant amount changes and no breakdown amounts exist yet,
  // auto-populate Year 1 with the full total.
  const handleTotalChange = (val) => {
    const next = { total_amount: val };
    if (!hasBreakdown) {
      const first = rows[0] || { label: '', amount: '' };
      next.funding_rows = [{ ...first, amount: val }, ...rows.slice(1)];
    }
    update(next);
  };

  const updateRow = (i, field, val) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: val };
    update({ funding_rows: next });
  };

  const addYear = () => {
    update({ funding_rows: [...rows, { label: '', amount: '' }] });
  };

  const removeYear = (i) => {
    const next = rows.filter((_, idx) => idx !== i);
    update({ funding_rows: next.length ? next : [{ label: '', amount: '' }] });
  };

  return (
    <div className="border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <DollarSign className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Financial Information</h3>
      </div>

      {/* Total Grant Amount */}
      <div className="mb-5">
        <p className="text-sm font-medium text-foreground mb-1.5">Total Grant Amount</p>
        <CurrencyInput value={form.total_amount} onChange={handleTotalChange} />
        {parsedTotal === null && <AmountError message={AMOUNT_ERROR} />}
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-foreground">Funding Schedule</p>
            <p className="text-xs text-muted-foreground mt-0.5">Schedule of payment by period</p>
          </div>
          <Button variant="outline" size="sm" onClick={addYear} className="h-8 gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Record
          </Button>
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-3">
              <Input
                value={row.label}
                onChange={e => updateRow(i, 'label', e.target.value)}
                placeholder="e.g., Year, Quarter"
                className="text-sm w-40 shrink-0"
              />
              <div className="flex-1">
                <CurrencyInput value={row.amount} onChange={v => updateRow(i, 'amount', v)} />
                {parsedRows[i] === null && <AmountError message={AMOUNT_ERROR} />}
              </div>
              {rows.length > 1 && (
                <button
                  onClick={() => removeYear(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-2.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Total + validation feedback */}
        <div className="mt-4 pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Funding Schedule</span>
            <span className="text-sm font-bold text-foreground">${breakdownTotal.toLocaleString()}</span>
          </div>

          {!hasInvalidAmounts && totalGrant > 0 && (
            matches ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Schedule matches the Total Grant Amount.
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" />
                Amount mismatch: schedule is {diff > 0 ? 'short by' : 'over by'} ${Math.abs(diff).toLocaleString()}. Adjust the schedule to equal ${totalGrant.toLocaleString()}.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}