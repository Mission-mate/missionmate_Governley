import React from 'react';
import { formatReviewDate as fmt } from '@/lib/complianceRegisters';
import OptionLabel from '@/components/shared/OptionLabel';
import { rpStatusColor } from './rpStatus';
import TermExpiryDate from './TermExpiryDate';
import RpSectionHead from './RpSectionHead';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { BOARD_SECTION, OFFICE_SECTION, TIPS } from './rpHelp';

const SECTION = 'rounded-xl bg-muted p-5';
const HEAD = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4';

function Item({ label, value, wide, tip }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">{label}{tip && <InfoTooltip text={tip} />}</p>
      <p className="text-sm text-foreground break-words">{value || '—'}</p>
    </div>
  );
}

/** Read-only Overview tab for a responsible person. */
export default function ResponsiblePersonOverview({ r, customColumns = [] }) {
  const custom = r.appointment_term === 'Custom';
  return (
    <div className="space-y-4">
      <section className={SECTION}>
        <p className={HEAD}>Responsible People Details</p>
        <div className="grid grid-cols-2 gap-4">
          <Item label="Full Name" value={r.full_name} />
          <Item label="Director ID" tip={TIPS.director_id} value={r.director_id} />
          <Item label="Type" value={r.person_type} />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
            {r.status ? <OptionLabel name={r.status} color={rpStatusColor(r.status)} /> : <p className="text-sm text-foreground">—</p>}
          </div>
          <Item label="Date of Birth" value={r.date_of_birth && fmt(r.date_of_birth)} />
          <Item label="Email" value={r.email} />
          <Item label="Phone" value={r.phone} />
          <Item label="Address" value={r.address} wide />
        </div>
      </section>
      <section className={SECTION}>
        <RpSectionHead {...BOARD_SECTION} />
        <div className="grid grid-cols-2 gap-4">
          <Item label="Date Appointed" tip={TIPS.appointment_date} value={r.appointment_date && fmt(r.appointment_date)} />
          <Item label="Appointment Term" tip={TIPS.appointment_term} value={custom ? `${r.interval_value || ''} ${r.interval_unit || ''}`.trim() : 'Ongoing'} />
          {custom && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Term Expiry</p>
              <div className="text-sm text-foreground"><TermExpiryDate value={r.term_expiry_date} status={r.status} /></div>
            </div>
          )}
          <Item label="Date Ceased as Board Member" tip={TIPS.date_ceased} value={r.date_ceased && fmt(r.date_ceased)} wide={!custom} />
        </div>
      </section>
      <section className={SECTION}>
        <RpSectionHead {...OFFICE_SECTION} />
        <div className="space-y-4">
          {(r.offices?.length ? r.offices : [{}]).map((o, i) => (
            <div key={o.id || i} className={i > 0 ? 'grid grid-cols-2 gap-4 border-t border-border pt-4' : 'grid grid-cols-2 gap-4'}>
              <Item label="Office Held" tip={TIPS.office_held} value={o.office_held} />
              <Item label="Committee" tip={TIPS.committee} value={o.committee} />
              <Item label="Date Commenced As Office Holder" tip={TIPS.office_commenced} value={o.date_commenced && fmt(o.date_commenced)} />
              <Item label="Date Ceased As Office Holder" tip={TIPS.office_ceased} value={o.date_ceased && fmt(o.date_ceased)} />
            </div>
          ))}
        </div>
      </section>
      {customColumns.length > 0 && (
        <section className={SECTION}>
          <p className={HEAD}>Additional Fields</p>
          <AssetCustomFields values={r} set={() => {}} edit={false} columns={customColumns} />
        </section>
      )}
    </div>
  );
}