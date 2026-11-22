import React from 'react';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import ViewModeHint from '@/components/shared/ViewModeHint';
import SectionCard from '@/components/shared/SectionCard';
import { cn } from '@/lib/utils';
import TagPills from '@/components/shared/tags/TagPills';
import { useCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldView } from '@/components/contacts/CustomFieldRenderer';
import { resolveStructureName, resolveTierName } from '@/lib/memberPlanNames';
import { ONLINE_PAYMENT_TYPE_LABELS } from '@/components/membership/MembershipDetailsCard';
import { MEMBERSHIP_SYSTEM_CUSTOM_FIELDS } from '@/lib/memberSystemFields';

const SECTION_LABEL = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider';

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  archived: 'bg-muted text-muted-foreground border-border',
};

const fmtDate = (d) => {
  if (!d) return '–';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '–'; }
};

const initials = (m) =>
  `${(m?.first_name || '').charAt(0)}${(m?.last_name || '').charAt(0)}`.toUpperCase() || '?';

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <div className="text-sm text-foreground">{children ?? <span className="text-muted-foreground/50">–</span>}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <SectionCard title={title}>
      <div className="space-y-3">{children}</div>
    </SectionCard>
  );
}

export default function MemberViewPane({ isOpen, member, onClose, onOpen, structures = [] }) {
  const { fields: customFields } = useCustomFields('membership');

  // Keep the pane mounted (closed) when there's no member so the shared close
  // animation can finish instead of the pane vanishing instantly.
  if (!member) return <SlidePane isOpen={false} onClose={onClose} />;

  const statusLabel = member.status
    ? member.status.charAt(0).toUpperCase() + member.status.slice(1)
    : '–';
  const values = member.custom_fields || {};

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="h-full flex flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
              {initials(member)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">
                {member.first_name} {member.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5', STATUS_STYLES[member.status] || STATUS_STYLES.archived)}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          <PaneIconHeaderActions onOpen={onOpen} onClose={onClose} />
        </div>
        <ViewModeHint className="mt-1.5" icon={ExternalLink} action="open" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Contact Details */}
          <Section title="Contact Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name">{member.first_name}</Field>
              <Field label="Last Name">{member.last_name}</Field>
              <Field label="Email">{member.email}</Field>
              <Field label="Phone">{member.phone}</Field>
              <Field label="Address">
                {[member.street_address, member.suburb, member.state, member.postal_code].filter(Boolean).join(', ') || null}
              </Field>
              <Field label="Tags">
                <TagPills ids={member.tags} className="mt-1" />
              </Field>
            </div>
          </Section>

          {/* Membership Details */}
          <Section title="Membership Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Membership Plan">{resolveStructureName(member, structures)}</Field>
              <Field label="Tier">{resolveTierName(member, structures)}</Field>
              <Field label="Start Date">{member.start_date ? fmtDate(member.start_date) : null}</Field>
              <Field label="Expiration Date">{member.expiration_date ? fmtDate(member.expiration_date) : 'Never'}</Field>
              <Field label="Payment Method">{member.payment_method}</Field>
              <Field label="Payment Status">{member.payment_status}</Field>
              {member.payment_method === 'Online Payment' && (
                <Field label="Payment Type">{ONLINE_PAYMENT_TYPE_LABELS[member.online_payment_type]}</Field>
              )}
            </div>
          </Section>

          {/* Additional Details — system-locked fields first, then custom fields */}
          <Section title="Additional Details">
            <div className="grid grid-cols-2 gap-3">
              {MEMBERSHIP_SYSTEM_CUSTOM_FIELDS.map((field) => (
                <CustomFieldView key={field.id} field={field} value={member[field.id]} />
              ))}
              {customFields.map((field) => (
                <CustomFieldView key={field.id} field={field} value={values[field.id]} />
              ))}
            </div>
          </Section>
        </div>
      </div>
    </SlidePane>
  );
}