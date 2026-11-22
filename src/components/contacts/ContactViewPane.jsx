import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import ViewModeHint from '@/components/shared/ViewModeHint';
import SectionCard from '@/components/shared/SectionCard';
import TagPills from '@/components/shared/tags/TagPills';
import SectionLoader from '@/components/shared/states/SectionLoader';
import { useCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldView } from '@/components/contacts/CustomFieldRenderer';
import { useContactTypeConfig } from '@/hooks/useContactTypeConfig';
import { CONTACT_TYPE_FIELD_ID, CONTACT_TYPE_BADGE_CLASSES } from '@/lib/contactTypeConfig';

const initials = (c) =>
  `${(c?.first_name || '').charAt(0)}${(c?.last_name || '').charAt(0)}`.toUpperCase() || '?';

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

export default function ContactViewPane({ isOpen, contact, onClose, onOpen }) {
  const { fields: customFields, isLoading: customFieldsLoading } = useCustomFields('contacts');
  const { config: ctConfig, isLoading: ctConfigLoading } = useContactTypeConfig();
  const configLoading = customFieldsLoading || ctConfigLoading;

  // Keep the pane mounted (closed) when there's no contact so the shared close
  // animation can finish instead of the pane vanishing instantly.
  if (!contact) return <SlidePane isOpen={false} onClose={onClose} />;

  const values = contact.custom_fields || {};
  const rawType = values[CONTACT_TYPE_FIELD_ID];
  const typeValues = Array.isArray(rawType) ? rawType : (rawType ? [rawType] : []);
  const typeLabels = typeValues.map((v) => ctConfig.options.find((o) => o.value === v)?.label || v);
  const extraFields = customFields.filter((f) => f.id !== CONTACT_TYPE_FIELD_ID);

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="h-full flex flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
              {initials(contact)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">
                {contact.first_name} {contact.last_name}
              </h2>
              {typeLabels.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {typeLabels.map((label) => (
                    <Badge key={label} variant="outline" className={CONTACT_TYPE_BADGE_CLASSES}>
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <PaneIconHeaderActions onOpen={onOpen} onClose={onClose} />
        </div>
        <ViewModeHint className="mt-1.5" icon={ExternalLink} action="open" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            <Section title="Contact Details">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name">{contact.first_name}</Field>
                <Field label="Last Name">{contact.last_name}</Field>
                <Field label="Email">{contact.email}</Field>
                <Field label="Phone">{contact.phone}</Field>
                <Field label="Company / Organization">{contact.company}</Field>
                <Field label="Address">{contact.address}</Field>
              </div>
            </Section>

            <Section title="Additional Details">
              {configLoading ? <SectionLoader /> : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Type">
                  {typeLabels.length === 0 ? null : (
                    <div className="flex flex-wrap gap-1.5">
                      {typeLabels.map((label) => (
                        <span key={label} className={CONTACT_TYPE_BADGE_CLASSES}>{label}</span>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="Tags">
                  <TagPills
                    ids={contact.tags}
                    empty={<span className="text-muted-foreground/50">–</span>}
                  />
                </Field>
                {extraFields.map((field) => (
                  <CustomFieldView key={field.id} field={field} value={values[field.id]} />
                ))}
              </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </SlidePane>
  );
}