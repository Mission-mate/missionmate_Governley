import React from 'react';
import YesNoToggle from '@/components/ui/YesNoToggle';
import FieldError from '@/components/shared/FieldError';
import { formatMoney } from '@/lib/giftRegister';
import PaymentScheduleEditor, { LABEL } from './PaymentScheduleEditor';

/** Financial value toggle, Contract Value and Payment Schedule. Read-only when !edit. */
export default function ContractFinancials({ values, setForm, edit, errors = {} }) {
  const on = values.has_financial_value;
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (v) => update(v
    ? { has_financial_value: true, payment_schedule: values.payment_schedule?.length ? values.payment_schedule : [{ label: '', amount: '' }] }
    : { has_financial_value: false, value: '', payment_schedule: [] });
  const rows = values.payment_schedule || [];

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5 items-end">
        <div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 px-5 h-[82px]">
            <div>
              <p className="text-sm font-medium text-foreground">Does this contract have a financial value?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Enable to record the contract value and payment schedule.</p>
            </div>
            <YesNoToggle checked={!!on} onChange={toggle} readOnly={!edit} />
          </div>
        </div>
        {on && (
          <div>
            <p className={`${LABEL} mb-3`}>Contract Value</p>
            {edit ? <PaymentScheduleEditor.Total values={values} update={update} /> : (
              <div className="flex items-center h-[82px] rounded-xl border border-border px-5 text-xl font-semibold text-foreground tabular-nums">
                {formatMoney(values.value) || '—'}
              </div>
            )}
          </div>
        )}
      </div>

      {on && (
        <div>
          <h3 className="text-base font-bold text-foreground">Payment Schedule</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">Split the contract value across payment periods.</p>
          {edit ? <><PaymentScheduleEditor values={values} update={update} /><FieldError msg={errors.payment_schedule} /></> : rows.length ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-2 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                <span>Period</span><span className="text-right">Amount</span>
              </div>
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-2 px-4 py-3 text-sm border-b border-border last:border-0">
                  <span className="text-foreground">{r.label || '—'}</span>
                  <span className="text-right tabular-nums text-foreground">{formatMoney(r.amount) || '—'}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No payments scheduled.</p>}
        </div>
      )}
    </div>
  );
}