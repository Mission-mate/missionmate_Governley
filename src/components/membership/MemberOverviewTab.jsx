import React, { useState } from 'react';
import { format } from 'date-fns';
import { User, Mail, Phone, FileText } from 'lucide-react';
import SectionEditButton from '@/components/shared/SectionEditButton';
import { Input } from '@/components/ui/input';
import CardEditFooter from '@/components/shared/CardEditFooter';
import DateField from '@/components/ui/DateField';
import TagPicker from '@/components/shared/tags/TagPicker';
import TagPills from '@/components/shared/tags/TagPills';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldView, CustomFieldEdit, defaultValueForField } from '@/components/contacts/CustomFieldRenderer';
import { MEMBER_SYSTEM_FIELDS, MEMBERSHIP_SYSTEM_CUSTOM_FIELDS, useSystemFieldVisibility } from '@/lib/memberSystemFields';
import MembershipDetailsCard from '@/components/membership/MembershipDetailsCard';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import useEditMutex from '@/components/shared/useEditMutex';

const fmtDate = (d) => {
  if (!d) return '–';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '–'; }
};

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

const FIELD_ICONS = { email: Mail, phone: Phone };

function SystemFieldView({ field, value }) {
  const Icon = FIELD_ICONS[field.key];
  const display = field.inputType === 'date' ? (value ? fmtDate(value) : '–') : (value || '–');
  return (
    <Field label={field.label}>
      {Icon ? (
        <span className="inline-flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {display}
        </span>
      ) : (
        display
      )}
    </Field>
  );
}

function CardHeader({ icon: Icon, title, editing, onEdit, readOnly, editDisabled }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      {!readOnly && !editing && <SectionEditButton onClick={onEdit} disabled={editDisabled} />}
    </div>
  );
}

export default function MemberOverviewTab({ member, onSaved, readOnly = false }) {
  const { toast } = useToast();
  const { fields: customFields } = useCustomFields('membership');
  const { visibility } = useSystemFieldVisibility();
  const visibleSystemFields = MEMBER_SYSTEM_FIELDS.filter((f) => visibility[f.key]);

  const { data: structures = [] } = useQuery({
    queryKey: ['membership_structures'],
    queryFn: () => base44.entities.MembershipStructure.list(),
  });
  // Only one section card may be in edit mode at a time.
  const { editingSection, requestEdit, closeEdit, setDirty, editBlocked } = useEditMutex();
  const editContact = editingSection === 'contact';
  const editAdditional = editingSection === 'additional';
  const [saving, setSaving] = useState(false);

  // Contact form — all system field keys plus tags
  const [cForm, setCForm] = useState({});
  // Custom field values
  const [customValues, setCustomValues] = useState({});
  // System-locked Additional Details values — persisted to real Member attributes
  const [sysValues, setSysValues] = useState({});

  // Forms are seeded from the member snapshot at the moment editing opens, so a
  // background refetch mid-edit can never overwrite in-progress changes.
  const openContactEdit = () => {
    const next = { tags: member.tags || [] };
    for (const f of MEMBER_SYSTEM_FIELDS) next[f.key] = member[f.key] || '';
    setCForm(next);
    requestEdit('contact');
  };

  const openAdditionalEdit = () => {
    setCustomValues(member.custom_fields || {});
    setSysValues({ organisation: member.organisation || '' });
    requestEdit('additional');
  };

  const persist = async (data) => {
    try {
      setSaving(true);
      await base44.entities.Member.update(member.id, data);
      toast({ title: 'Member updated' });
      if (onSaved) await onSaved();
    } catch {
      toast({ title: 'Error', description: 'Failed to update member.', variant: 'destructive' });
      throw new Error('save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveContact = async () => {
    if (!(cForm.first_name || '').trim()) { toast({ title: 'First name is required', variant: 'destructive' }); return; }
    try {
      const data = { tags: cForm.tags };
      for (const f of MEMBER_SYSTEM_FIELDS) data[f.key] = (cForm[f.key] || '').trim();
      await persist(data);
      closeEdit();
    } catch { /* toast already shown */ }
  };

  const saveAdditional = async () => {
    try {
      await persist({
        organisation: sysValues.organisation || '',
        custom_fields: { ...(member.custom_fields || {}), ...customValues },
      });
      closeEdit();
    } catch { /* toast already shown */ }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact Details */}
        <div className={ELEVATED_SECTION}>
          <CardHeader icon={User} title="Contact Details" editing={editContact} readOnly={readOnly}
            onEdit={openContactEdit} editDisabled={editBlocked} />
          <div className="space-y-5">
            {editContact ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {visibleSystemFields.map((f) => (
                    <div key={f.key}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{f.label}{f.key === 'first_name' && <span className="text-destructive"> *</span>}</p>
                      {f.inputType === 'date' ? (
                        <DateField
                          value={cForm[f.key] || ''}
                          onChange={(v) => { setDirty(); setCForm((prev) => ({ ...prev, [f.key]: v })); }}
                        />
                      ) : (
                        <Input
                          type={f.inputType}
                          value={cForm[f.key] || ''}
                          onChange={(e) => { setDirty(); setCForm((prev) => ({ ...prev, [f.key]: e.target.value })); }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tags</p>
                  <TagPicker value={cForm.tags || []}
                    onChange={(v) => { setDirty(); setCForm((f) => ({ ...f, tags: v })); }} />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  {visibleSystemFields.map((f) => (
                    <SystemFieldView key={f.key} field={f} value={member[f.key]} />
                  ))}
                </div>
                <Field label="Tags">
                  <TagPills
                    ids={member.tags}
                    empty={<span className="text-muted-foreground">–</span>}
                  />
                </Field>
              </>
            )}
          </div>
          {editContact && (
            <CardEditFooter onCancel={closeEdit} onSave={saveContact} saving={saving} />
          )}
        </div>

        {/* Membership Details */}
        <MembershipDetailsCard
          member={member}
          structures={structures}
          onSaved={onSaved}
          readOnly={readOnly}
          editing={editingSection === 'membership'}
          onRequestEdit={() => requestEdit('membership')}
          onCloseEdit={closeEdit}
          onDirty={setDirty}
          editDisabled={editBlocked}
        />
      </div>

      {/* Additional Details */}
      <div className={ELEVATED_SECTION}>
        <CardHeader icon={FileText} title="Additional Details" editing={editAdditional} readOnly={readOnly}
          onEdit={openAdditionalEdit} editDisabled={editBlocked} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
          {/* System-locked fields — values live on the Member entity itself */}
          {MEMBERSHIP_SYSTEM_CUSTOM_FIELDS.map((field) => (
            editAdditional ? (
              <div key={field.id}>
                <p className="text-xs font-medium text-muted-foreground mb-1">{field.name}</p>
                <CustomFieldEdit
                  field={field}
                  value={sysValues[field.id] ?? ''}
                  onChange={(v) => { setDirty(); setSysValues((p) => ({ ...p, [field.id]: v })); }}
                />
              </div>
            ) : (
              <CustomFieldView key={field.id} field={field} value={member[field.id]} />
            )
          ))}
          {customFields.map((field) => (
              editAdditional ? (
                <div key={field.id}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{field.name}</p>
                  <CustomFieldEdit
                    field={field}
                    value={customValues[field.id] ?? defaultValueForField(field)}
                    onChange={(v) => { setDirty(); setCustomValues((p) => ({ ...p, [field.id]: v })); }}
                  />
                </div>
              ) : (
                <CustomFieldView key={field.id} field={field} value={member.custom_fields?.[field.id]} />
              )
          ))}
        </div>
        {editAdditional && (
          <CardEditFooter onCancel={closeEdit} onSave={saveAdditional} saving={saving} />
        )}
      </div>
    </div>
  );
}