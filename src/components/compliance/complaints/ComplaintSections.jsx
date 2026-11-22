import React from 'react';
import GiftField from '@/components/compliance/gifts/GiftField';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';
import { getAssetCustomColumns } from '@/lib/assetRegister';
import { STATUS_OPTIONS, SEVERITY_OPTIONS, channelOptions, CORRECTIVE_ACTION_OPTIONS, ACTION_STATUS_OPTIONS } from '@/lib/complaintRegister';

export const COMPLAINT_STEPS = ['Complaint Details', 'Assessment', 'Resolution'];

function Section({ id, title, children }) {
  return (
    <section id={id} className="rounded-xl bg-muted p-5 scroll-mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

/** Complaint sections. `step` (0-2) renders one creation step; omitted renders all (view/edit). */
export default function ComplaintSections({ register, values, set, edit, codeError, step, errors }) {
  const p = { values, set, edit, errors };
  const customColumns = getAssetCustomColumns(register);
  const show = (i) => step === undefined || step === i;
  return (
    <>
      {show(0) && (
        <Section id="complaint-step-0" title="Complaint Details">
          <GiftField {...p} k="complaint_code" label="Complaint ID *" placeholder="e.g., CMP-001" error={codeError} />
          <GiftField {...p} k="complaint_date" label="Complaint Date *" type="date" />
          <GiftField {...p} k="complainant_name" label="Complainant Name *" help="The person making the complaint" placeholder="e.g. Jane Smith or Anonymous" full />
          <GiftField {...p} k="complainant_email" label="Complainant Email" placeholder="e.g., jane@example.com" />
          <GiftField {...p} k="complainant_phone" label="Complainant Phone" placeholder="e.g., 0400 000 000" />
          <GiftField {...p} k="status" label="Complaint Status *" type="select" options={STATUS_OPTIONS} colored required />
          <GiftField {...p} k="severity" label="Complaint Severity" type="select" options={SEVERITY_OPTIONS} colored />
          <GiftField {...p} k="taken_by" label="Complaint Taken By" type={edit ? 'text' : 'person'} placeholder="e.g., Customer Service Officer" />
          <GiftField {...p} k="channel" label="Complaint Channel" type="select" options={channelOptions(register)} />
        </Section>
      )}
      {show(0) && customColumns.length > 0 && (
        <section className="rounded-xl bg-muted p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Additional Details</p>
          <AssetCustomFields values={values} set={set} edit={edit} columns={customColumns} />
        </section>
      )}
      {show(1) && (
        <Section id="complaint-step-1" title="Assessment">
          <GiftField {...p} k="details" label="Complaint Description *" type="long" full
            placeholder="Provide a summary of the complaint, including what occurred, when it occurred, who was involved, and the complainant's account in their own words." />
          <GiftField {...p} k="root_cause" label="Root Cause Analysis" type="long" full
            placeholder="Identify the underlying factors or circumstances that contributed to the complaint and explain why the issue occurred." />
        </Section>
      )}
      {show(2) && (
        <Section id="complaint-step-2" title="Resolution">
          <GiftField {...p} k="corrective_action" label="Corrective Action" type="select" options={CORRECTIVE_ACTION_OPTIONS} />
          {values.corrective_action === 'Required' && <>
            <GiftField {...p} k="action_status" label="Action Status" type="select" options={ACTION_STATUS_OPTIONS} />
            <GiftField {...p} k="corrective_action_details" label="Corrective Action Details" type="long" full
              placeholder="Record the outcome of the complaint investigation, actions taken to address the issue, and measures implemented to prevent a recurrence." />
          </>}
          <GiftField {...p} k="date_resolved" label="Date Resolved" type="date" />
          <GiftField {...p} k="resolved_by" label="Resolved By" type={edit ? 'text' : 'person'} placeholder="e.g., Complaint handler name" />
        </Section>
      )}
    </>
  );
}