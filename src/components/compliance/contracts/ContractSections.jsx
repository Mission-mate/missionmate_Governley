import React from 'react';
import GiftField from '@/components/compliance/gifts/GiftField';
import { calcNextReviewDate } from '@/lib/reviewDateUtils';
import { CONTRACT_STATUS_OPTIONS } from '@/lib/contractRegister';
import ContractReviewFields from './ContractReviewFields';
import AdditionalParties from './AdditionalParties';
import AddDescriptionToggle from '@/components/compliance/assets/AddDescriptionToggle';

const REVIEW_KEYS = ['review_frequency', 'interval_value', 'interval_unit', 'last_review_date'];

function Section({ title, bare, children }) {
  if (bare) return <div className="grid grid-cols-2 gap-x-6 gap-y-5">{children}</div>;
  return (
    <section className="rounded-xl bg-muted p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

/**
 * Contract Details, Key Dates and Parties sections. Review edits recalculate Next Review Date.
 * `only` renders a single section ('details' | 'dates' | 'parties'); `bare` drops the grey surface
 * so a detail-page card can host the fields.
 */
export default function ContractSections({ values, setForm, edit, only, bare, typeOptions, errors }) {
  const show = (k) => !only || only === k;
  const set = (k, v) => setForm((f) => {
    const n = { ...f, [k]: v };
    if (REVIEW_KEYS.includes(k)) {
      n.next_review_date = n.last_review_date ? calcNextReviewDate(n.review_frequency, {
        baseDate: n.last_review_date, intervalValue: n.interval_value, intervalUnit: n.interval_unit,
      }) || '' : '';
    }
    return n;
  });
  const p = { values, set, edit, errors };
  return (
    <>
      {show('details') && <Section title="Contract Details" bare={bare}>
        <GiftField {...p} k="contract_code" label="Contract Reference *" placeholder="e.g., CON-001" />
        <GiftField {...p} k="status" label="Status" type="select" options={CONTRACT_STATUS_OPTIONS} />
        <GiftField {...p} k="title" label="Contract Title *" placeholder="e.g., IT Support Services Agreement" full />
        {edit
          ? <AddDescriptionToggle value={values.description} onChange={(v) => set('description', v)} placeholder="Describe the contract..." className="col-span-2" />
          : values.description?.trim() && <GiftField {...p} k="description" label="Description" type="long" full />}
        <GiftField {...p} k="contract_type" label="Type" type="select" options={typeOptions} />
        <GiftField {...p} k="owner" label="Contract Owner" type="person" placeholder="e.g., CEO" />
        <GiftField {...p} k="manager" label="Contract Manager" type="person" placeholder="e.g., Operations Manager" />
        <GiftField {...p} k="business_division" label="Business Division" placeholder="e.g., Finance" help="The business area the contract relates to" />
      </Section>}
      {show('dates') && <Section title="Key Dates" bare={bare}>
        <GiftField {...p} k="start_date" label="Start Date" type="date" />
        <GiftField {...p} k="expiry_date" label="Expiry Date" type="date" />
        <ContractReviewFields {...p} />
      </Section>}
      {show('parties') && <Section title="Parties" bare={bare}>
        <GiftField {...p} k="party_name" label="Counterparty" placeholder="e.g., ABC Pty Ltd" />
        <GiftField {...p} k="party_contact" label="Contact Person" placeholder="e.g., Jane Smith" />
        <GiftField {...p} k="party_email" label="Email" placeholder="e.g., jane@abc.com.au" />
        <GiftField {...p} k="party_phone" label="Phone" placeholder="e.g., 08 8900 0000" />
        <AdditionalParties values={values} setForm={setForm} edit={edit} />
      </Section>}
    </>
  );
}