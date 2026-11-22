import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CardEditFooter from '@/components/shared/CardEditFooter';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import ContactAdditionalDetailsCard from '@/components/contacts/detail/ContactAdditionalDetailsCard';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionEditButton from '@/components/shared/SectionEditButton';
import useEditMutex from '@/components/shared/useEditMutex';

function ViewField({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-0.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </div>
      <p className="text-sm font-medium text-foreground">{value || '–'}</p>
    </div>
  );
}

function EditField({ label, value, onChange, required }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </p>
      <Input value={value || ''} onChange={e => onChange(e.target.value)} className="h-8 text-sm" />
    </div>
  );
}

export default function ContactInformationTab({ contact, onSaved }) {
  const { toast } = useToast();
  // Only one section card may be in edit mode at a time.
  const { editingSection, requestEdit, closeEdit, setDirty, editBlocked } = useEditMutex();
  const editingInfo = editingSection === 'contact';
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({});

  useEffect(() => {
    setInfoForm({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      address: contact.address || '',
    });
  }, [contact]);

  // Reseed from the live record whenever editing opens, so a cancelled draft is
  // never carried back into the next edit.
  const openInfoEdit = () => {
    setInfoForm({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      address: contact.address || '',
    });
    requestEdit('contact');
  };

  const infoField = (key) => ({
    value: infoForm[key],
    onChange: (val) => { setDirty(); setInfoForm(prev => ({ ...prev, [key]: val })); },
  });

  const handleSaveInfo = async () => {
    // First Name is mandatory — same rule enforced on create and on import.
    if (!(infoForm.first_name || '').trim()) {
      toast({ title: 'First name is required', variant: 'destructive' });
      return;
    }
    try {
      setSavingInfo(true);
      await base44.entities.Contact.update(contact.id, {
        ...infoForm,
        first_name: infoForm.first_name.trim(),
      });
      await onSaved();
      closeEdit();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save contact details.', variant: 'destructive' });
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {/* Contact Details */}
      <div className={`${ELEVATED_SECTION} h-full`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-foreground">Contact Details</h2>
          {!editingInfo && (
            <SectionEditButton onClick={openInfoEdit} disabled={editBlocked} />
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-5">
          {editingInfo ? (
            <>
              <EditField label="First Name" required {...infoField('first_name')} />
              <EditField label="Last Name" {...infoField('last_name')} />
              <EditField label="Email" {...infoField('email')} />
              <EditField label="Phone Number" {...infoField('phone')} />
              <EditField label="Company / Organization" {...infoField('company')} />
              <EditField label="Address" {...infoField('address')} />
            </>
          ) : (
            <>
              <ViewField label="First Name" value={contact.first_name} />
              <ViewField label="Last Name" value={contact.last_name} />
              <ViewField icon={Mail} label="Email" value={contact.email} />
              <ViewField icon={Phone} label="Phone Number" value={contact.phone} />
              <ViewField icon={Building2} label="Company / Organization" value={contact.company} />
              <ViewField icon={MapPin} label="Address" value={contact.address} />
            </>
          )}
        </div>
        {editingInfo && (
          <CardEditFooter onCancel={closeEdit} onSave={handleSaveInfo} saving={savingInfo} />
        )}
      </div>

      {/* Additional Details — Contact ID, Contact Type, Tags, custom fields */}
      <ContactAdditionalDetailsCard
        contact={contact}
        onSaved={onSaved}
        editing={editingSection === 'additional'}
        onRequestEdit={() => requestEdit('additional')}
        onCloseEdit={closeEdit}
        onDirty={setDirty}
        editDisabled={editBlocked}
      />
    </div>
  );
}