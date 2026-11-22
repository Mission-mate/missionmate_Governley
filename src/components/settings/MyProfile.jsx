import React, { useState, useEffect } from 'react';
import { pick } from 'lodash';
import MicrosoftAuthenticatorCard from '@/components/settings/MicrosoftAuthenticatorCard';
import SettingsCard from '@/components/settings/profile/SettingsCard';
import ProfilePictureCard from '@/components/settings/profile/ProfilePictureCard';
import PersonalInfoCard from '@/components/settings/profile/PersonalInfoCard';
import useEditMutex from '@/components/shared/useEditMutex';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const EMPTY = { first_name: '', last_name: '', phone: '', avatar_url: '' };
// Fields each card owns — a card saves and cancels only its own fields.
const CARD_FIELDS = {
  picture: ['avatar_url'],
  personal: ['first_name', 'last_name', 'phone'],
};

export default function MyProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [savedForm, setSavedForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { editingSection, requestEdit, closeEdit, setDirty, editBlocked } = useEditMutex();

  useEffect(() => {
    if (!user) return;
    // auth.me() returns custom user fields at the top level. `d` is a legacy
    // compat shim for older records that nested them under `data`.
    const d = user.data || {};
    const fallback = (user.full_name || '').trim().split(' ');
    const loaded = {
      first_name: user.first_name || d.first_name || fallback[0] || '',
      last_name: user.last_name || d.last_name || fallback.slice(1).join(' ') || '',
      phone: user.phone || d.phone || '',
      avatar_url: user.avatar_url || d.avatar_url || '',
    };
    setForm(loaded);
    setSavedForm(loaded);
  }, [user]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  useEffect(() => { if (editingSection) setDirty(isDirty); }, [isDirty, editingSection]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const cancel = (key) => {
    setForm((f) => ({ ...f, ...pick(savedForm, CARD_FIELDS[key]) }));
    closeEdit();
  };

  const save = async (key) => {
    const patch = pick(form, CARD_FIELDS[key]);
    setSaving(true);
    try {
      await base44.auth.updateMe(patch);
      setSavedForm((s) => ({ ...s, ...patch }));
      closeEdit();
      await refreshUser();
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

  const initials = ((form.first_name?.[0] || '') + (form.last_name?.[0] || '')).toUpperCase() || (user?.full_name?.[0] || 'U').toUpperCase();

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-1">My Profile</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your personal account details and security.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch mb-6">
        <ProfilePictureCard
          value={form.avatar_url}
          onChange={(avatar_url) => update({ avatar_url })}
          initials={initials}
          cardProps={cardProps('picture')}
        />
        <PersonalInfoCard
          form={form}
          email={user?.email || ''}
          onChange={update}
          cardProps={cardProps('personal', { saveDisabled: !isDirty || !form.first_name.trim() || !form.last_name.trim() })}
        />
      </div>

      <SettingsCard title="Multi-Factor Authentication" subtitle="Add an extra layer of security to your account.">
        <MicrosoftAuthenticatorCard />
      </SettingsCard>
    </div>
  );
}