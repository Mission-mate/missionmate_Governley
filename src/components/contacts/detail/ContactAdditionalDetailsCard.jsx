import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import CardEditFooter from '@/components/shared/CardEditFooter';
import { useToast } from '@/components/ui/use-toast';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionEditButton from '@/components/shared/SectionEditButton';
import SectionLoader from '@/components/shared/states/SectionLoader';
import TagPicker from '@/components/shared/tags/TagPicker';
import TagPills from '@/components/shared/tags/TagPills';
import ContactTypeField from '@/components/contacts/ContactTypeField';
import { CustomFieldView, CustomFieldEdit, defaultValueForField } from '@/components/contacts/CustomFieldRenderer';
import { useContactTypeConfig } from '@/hooks/useContactTypeConfig';
import { useCustomFields } from '@/hooks/useCustomFields';
import { CONTACT_TYPE_FIELD_ID, isMultiSelect, CONTACT_TYPE_BADGE_CLASSES } from '@/lib/contactTypeConfig';

export default function ContactAdditionalDetailsCard({
  contact, onSaved,
  // Edit state is owned by the parent so only one section card edits at a time.
  editing = false, onRequestEdit = () => {}, onCloseEdit = () => {}, onDirty = () => {},
  // True when another card holds an unsaved draft — this card's Edit is blocked.
  editDisabled = false,
}) {
  const { toast } = useToast();
  const { config: ctConfig, isLoading: ctConfigLoading } = useContactTypeConfig();
  const { fields: customFields, isLoading: customFieldsLoading } = useCustomFields('contacts');
  const configLoading = ctConfigLoading || customFieldsLoading;

  const [saving, setSaving] = useState(false);
  const [contactType, setContactType] = useState(isMultiSelect(ctConfig) ? [] : '');
  const [customValues, setCustomValues] = useState({});
  const [tags, setTags] = useState([]);

  const reset = () => {
    const raw = contact.custom_fields?.[CONTACT_TYPE_FIELD_ID];
    setContactType(isMultiSelect(ctConfig) ? (Array.isArray(raw) ? raw : (raw ? [raw] : [])) : (raw || ''));
    setCustomValues(contact.custom_fields || {});
    setTags(contact.tags || []);
  };

  useEffect(reset, [contact, ctConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const nextCustom = { ...(contact.custom_fields || {}), ...customValues, [CONTACT_TYPE_FIELD_ID]: contactType };
      await base44.entities.Contact.update(contact.id, { custom_fields: nextCustom, tags });
      await onSaved();
      onCloseEdit();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save additional details.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    reset();
    onCloseEdit();
  };

  const rawType = contact.custom_fields?.[CONTACT_TYPE_FIELD_ID];
  const typeValues = Array.isArray(rawType) ? rawType : (rawType ? [rawType] : []);
  const typeLabels = typeValues.map((v) => ctConfig.options.find((o) => o.value === v)?.label || v);
  const extraFields = customFields.filter((f) => f.id !== CONTACT_TYPE_FIELD_ID);

  return (
    <div className={`${ELEVATED_SECTION} h-full`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-foreground">Additional Details</h2>
        {!editing && !configLoading && (
          <SectionEditButton onClick={onRequestEdit} disabled={editDisabled} />
        )}
      </div>

      {configLoading ? <SectionLoader size="md" /> : (
      <div className="grid grid-cols-2 gap-x-12 gap-y-5">
        {/* Row 1 — Contact Type + Tags */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Contact Type</p>
          {editing ? (
            <ContactTypeField config={ctConfig} value={contactType} onChange={(v) => { onDirty(); setContactType(v); }} />
          ) : typeLabels.length === 0 ? (
            <p className="text-sm font-medium text-foreground">–</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {typeLabels.map((label) => (
                <span key={label} className={CONTACT_TYPE_BADGE_CLASSES}>{label}</span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Tags</p>
          {editing ? (
            <TagPicker value={tags} onChange={(v) => { onDirty(); setTags(v); }} />
          ) : (
            <TagPills
              ids={contact.tags}
              empty={<p className="text-sm text-muted-foreground">No tags assigned.</p>}
            />
          )}
        </div>

        {/* Custom fields — two-column grid */}
        {extraFields.map((field) => (
          editing ? (
            <div key={field.id}>
              <p className="text-xs font-medium text-muted-foreground mb-1">{field.name}</p>
              <CustomFieldEdit
                field={field}
                value={customValues[field.id] ?? defaultValueForField(field)}
                onChange={(v) => { onDirty(); setCustomValues((p) => ({ ...p, [field.id]: v })); }}
              />
            </div>
          ) : (
            <CustomFieldView key={field.id} field={field} value={contact.custom_fields?.[field.id]} />
          )
        ))}
      </div>
      )}
      {editing && <CardEditFooter onCancel={handleCancel} onSave={handleSave} saving={saving} />}
    </div>
  );
}