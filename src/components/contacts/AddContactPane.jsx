import React, { useState, useEffect } from 'react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SlidePane from '@/components/ui/SlidePane';
import SectionCard from '@/components/shared/SectionCard';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useContactTypeConfig } from '@/hooks/useContactTypeConfig';
import { CONTACT_TYPE_FIELD_ID, isMultiSelect } from '@/lib/contactTypeConfig';
import ContactTypeField from './ContactTypeField';
import ContactTypeLabel from './ContactTypeLabel';
import TagPicker from '@/components/shared/tags/TagPicker';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import SectionLoader from '@/components/shared/states/SectionLoader';

const EMPTY = { first_name: '', last_name: '', email: '', phone: '', company: '', address: '' };

export default function AddContactPane({ isOpen, onClose: closeNow, onCreated }) {
  const { toast } = useToast();
  const { config, isLoading: configLoading } = useContactTypeConfig();
  const [form, setForm] = useState(EMPTY);
  const [contactType, setContactType] = useState(isMultiSelect(config) ? [] : '');
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState({ form: EMPTY, contactType, tags: [] });
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { form, contactType, tags }, baseline, onClose: closeNow, saving,
    enabled: isOpen && !configLoading, subject: 'contact details',
  });
  const onClose = () => requestClose();

  useEffect(() => {
    if (isOpen) {
      const type = isMultiSelect(config) ? [] : '';
      setForm(EMPTY);
      setContactType(type);
      setTags([]);
      setBaseline({ form: EMPTY, contactType: type, tags: [] });
    }
  }, [isOpen, config]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const typeEmpty = isMultiSelect(config)
    ? (!Array.isArray(contactType) || contactType.length === 0)
    : !contactType;

  const handleSave = async () => {
    if (!form.first_name.trim()) {
      toast({ title: 'First name is required', variant: 'destructive' });
      return;
    }
    if (typeEmpty) {
      toast({ title: 'Contact type is required', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await base44.entities.Contact.create({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        address: form.address.trim(),
        tags,
        custom_fields: { [CONTACT_TYPE_FIELD_ID]: contactType },
      });
      toast({ title: 'Contact created' });
      await onCreated();
      closeNow();
    } catch {
      toast({ title: 'Error', description: 'Failed to create contact.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {dialog}
      <div className="h-full bg-background flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Add Contact</h2>
            <p className="text-sm text-muted-foreground">Create a new contact in your database.</p>
          </div>
          <PaneIconHeaderActions showEdit={false} onClose={onClose} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <SectionCard className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">First Name <span className="text-red-500">*</span></Label>
            <Input value={form.first_name} onChange={set('first_name')} placeholder="e.g., Jane" className="bg-card" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Last Name</Label>
            <Input value={form.last_name} onChange={set('last_name')} placeholder="e.g., Doe" className="bg-card" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Email</Label>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="e.g., Jane.doe@mission.com" className="bg-card" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Phone Number</Label>
            <Input value={form.phone} onChange={set('phone')} placeholder="e.g., 0412 345 678" className="bg-card" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Company</Label>
            <Input value={form.company} onChange={set('company')} placeholder="e.g. Mission Foundation" className="bg-card" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Address</Label>
            <Input value={form.address} onChange={set('address')} placeholder="e.g., North Central Park, CA" className="bg-card" />
          </div>
          <div>
            <ContactTypeLabel />
            {configLoading ? (
              <SectionLoader className="py-3" />
            ) : (
              <ContactTypeField config={config} value={contactType} onChange={setContactType} />
            )}
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Tags</Label>
            <TagPicker value={tags} onChange={setTags} />
          </div>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Creating...' : 'Create Contact'}</Button>
        </div>
      </div>
    </SlidePane>
  );
}