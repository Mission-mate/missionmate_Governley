import React from 'react';
import GiftField from './GiftField';
import AddDescriptionToggle from '@/components/compliance/assets/AddDescriptionToggle';
import { GIFT_TYPE_OPTIONS, COI_OPTIONS, APPROVAL_OPTIONS, hasConflict, financialYearOf } from '@/lib/giftRegister';

function Section({ title, children }) {
  return (
    <section className="rounded-xl bg-muted p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

/** The two wrapped Overview sections: Gift or Benefit Details, and Approval and Declaration. */
export default function GiftSections({ values, set, edit, codeError, errors }) {
  const p = { values: { ...values, financial_year: financialYearOf(values.date_received) }, set, edit, errors };
  return (
    <>
      <Section title="Gift or Benefit Details">
        <GiftField {...p} k="record_code" label="Record ID *" placeholder="e.g., GBH-001" error={codeError} />
        <GiftField {...p} k="date_received" label="Date Received *" type="date" />
        <GiftField {...p} k="financial_year" label="Financial Year" type="readonly" />
        <GiftField {...p} k="gift_type" label="Type *" type="select" options={GIFT_TYPE_OPTIONS} />
        <GiftField {...p} k="title" label="Title of Gift/Benefit *" placeholder="e.g., Conference Tickets" full />
        <GiftField {...p} k="description" label="Description of Gift/Benefit *" type="long" placeholder="Describe the gift or benefit..." full />
        {edit ? (
          <AddDescriptionToggle value={values.reason} onChange={(v) => set('reason', v)} label="Reason for Gift/Benefit" placeholder="Why was it offered?" className="col-span-2" />
        ) : values.reason ? (
          <GiftField {...p} k="reason" label="Reason for Gift/Benefit" type="long" placeholder="Why was it offered?" full />
        ) : null}
        <GiftField {...p} k="presented_by" label="Presented By *" placeholder="e.g., ABS Advisory Group" />
        <GiftField {...p} k="relationship_nature" label="Nature of Relationship" placeholder="e.g., Service provider" />
        <GiftField {...p} k="received_by" label="Received By" placeholder="e.g., Project Team, CEO" />
        <GiftField {...p} k="estimated_value" label="Estimated Market Value" type="money" placeholder="0.00" />
      </Section>
      <Section title="Approval and Declaration">
        <GiftField {...p} k="conflict_of_interest" label="Conflict of Interest *" type="select" options={COI_OPTIONS} />
        <GiftField {...p} k="declaration_date" label="Declaration Date" type="date" />
        {hasConflict(values.conflict_of_interest) && (
          <GiftField {...p} k="conflict_details" label="Conflict Details" type="long" placeholder="e.g., Why the offer may create a conflict" full />
        )}
        <GiftField {...p} k="approval_decision" label="Approval Decision" type="select" options={APPROVAL_OPTIONS} />
        <GiftField {...p} k="approved_by" label="Approved By" placeholder="e.g., Board Chair" />
      </Section>
    </>
  );
}