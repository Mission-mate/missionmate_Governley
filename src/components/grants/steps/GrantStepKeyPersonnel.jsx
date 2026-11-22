import React from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function GrantStepKeyPersonnel({ form, update }) {
  const updateContact = (i, field, val) => {
    const contacts = [...form.provider_contacts];
    contacts[i] = { ...contacts[i], [field]: val };
    update({ provider_contacts: contacts });
  };

  const addContact = () => {
    update({ provider_contacts: [...form.provider_contacts, { name: '', role: '', email: '', phone: '' }] });
  };

  const removeContact = (i) => {
    const contacts = form.provider_contacts.filter((_, idx) => idx !== i);
    update({ provider_contacts: contacts.length ? contacts : [{ name: '', role: '', email: '', phone: '' }] });
  };

  return (
    <div className="border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Grant Provider Contact Details</h3>
        </div>
        <Button variant="outline" size="sm" onClick={addContact} className="h-8 gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </Button>
      </div>

      <div className="space-y-4">
        {form.provider_contacts.map((contact, i) => (
          <div key={i} className="space-y-3 pb-4 border-b border-border last:border-0 last:pb-0">
            {form.provider_contacts.length > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{i === 0 ? 'Name (Primary)' : `Contact ${i + 1}`}</span>
                <button onClick={() => removeContact(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                {i === 0 && <p className="text-sm font-medium text-foreground mb-1.5">Name (Primary)</p>}
                <Input value={contact.name} onChange={e => updateContact(i, 'name', e.target.value)} placeholder="E.g., Jane Doe" className="text-sm" />
              </div>
              <div>
                {i === 0 && <p className="text-sm font-medium text-foreground mb-1.5">Role/Title</p>}
                <Input value={contact.role} onChange={e => updateContact(i, 'role', e.target.value)} placeholder="e.g., Grant Manager" className="text-sm" />
              </div>
              <div>
                {i === 0 && <p className="text-sm font-medium text-foreground mb-1.5">Email</p>}
                <Input value={contact.email} onChange={e => updateContact(i, 'email', e.target.value)} placeholder="E.g., Jane.doe@mission.com" className="text-sm" />
              </div>
              <div>
                {i === 0 && <p className="text-sm font-medium text-foreground mb-1.5">Phone</p>}
                <Input value={contact.phone} onChange={e => updateContact(i, 'phone', e.target.value)} placeholder="E.g., (02) 5550 1234" className="text-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}