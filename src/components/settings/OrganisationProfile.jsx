import React, { useState, useEffect, useMemo } from 'react';
import { pick } from 'lodash';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import useEditMutex from '@/components/shared/useEditMutex';
import OrgLogoCard from '@/components/settings/profile/OrgLogoCard';
import OrgBasicInfoCard from '@/components/settings/profile/OrgBasicInfoCard';

const CONFIG_KEY = 'org_profile';

function validate(form) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Organisation name is required.';
  if (!form.timezone) errors.timezone = 'Time zone is required.';
  return errors;
}

const EMPTY = { name: '', email: '', phone: '', timezone: '', logo_url: '' };
// Fields each card owns — a card saves and cancels only its own fields.
const CARD_FIELDS = {
  logo: ['logo_url'],
  basic: ['name', 'email', 'phone', 'timezone'],
};

export default function OrganisationProfile() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [savedForm, setSavedForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const { editingSection, requestEdit, closeEdit, setDirty, editBlocked } = useEditMutex();

  const errors = useMemo(() => validate(form), [form]);
  const errorFor = (field) => (touched[field] ? errors[field] : undefined);

  // Always read the stored profile from the database so the fields stay
  // populated on every visit / reload, not just the first mount.
  const { data: configRecord, isLoading: loading } = useQuery({
    queryKey: ['orgProfileRecord'],
    queryFn: async () => {
      const records = await base44.entities.AppConfig.filter({ key: CONFIG_KEY });
      return records[0] ?? null;
    },
  });

  useEffect(() => {
    const loaded = { ...EMPTY, ...pick(configRecord?.settings ?? {}, Object.keys(EMPTY)) };
    setForm(loaded);
    setSavedForm(loaded);
    setTouched({});
  }, [configRecord]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  useEffect(() => { if (editingSection) setDirty(isDirty); }, [isDirty, editingSection]);

  const setField = (field, value) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setForm((f) => ({ ...f, [field]: value }));
  };

  const cancel = (key) => {
    setForm((f) => ({ ...f, ...pick(savedForm, CARD_FIELDS[key]) }));
    setTouched({});
    closeEdit();
  };

  const save = async (key) => {
    const patch = pick(form, CARD_FIELDS[key]);
    setSaving(true);
    try {
      // Merge onto the stored settings so keys owned by other features are kept.
      const settings = { ...(configRecord?.settings ?? {}), ...patch };
      if (configRecord?.id) await base44.entities.AppConfig.update(configRecord.id, { settings });
      else await base44.entities.AppConfig.create({ key: CONFIG_KEY, settings });
      setSavedForm((s) => ({ ...s, ...patch }));
      closeEdit();
      await queryClient.invalidateQueries({ queryKey: ['orgProfileRecord'] });
      queryClient.invalidateQueries({ queryKey: ['orgProfile'] });
    } finally {
      setSaving(false);
    }
  };

  const cardProps = (key, extra = {}) => ({
    editing: editingSection === key,
    editDisabled: editBlocked,
    onEdit: () => requestEdit(key),
    onCancel: () => cancel(key),
    onSave: () => save(key),
    saving,
    saveDisabled: !isDirty,
    ...extra,
  });

  if (loading) return <ModuleLoader fullPage />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-1">Organisation Profile</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your organisation's details and public profile.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <OrgLogoCard
          value={form.logo_url}
          orgName={form.name}
          onChange={(v) => setForm((f) => ({ ...f, logo_url: v }))}
          cardProps={cardProps('logo')}
        />
        <OrgBasicInfoCard
          form={form}
          onChange={setField}
          errorFor={errorFor}
          cardProps={cardProps('basic', { saveDisabled: !isDirty || Object.keys(errors).length > 0 })}
        />
      </div>
    </div>
  );
}