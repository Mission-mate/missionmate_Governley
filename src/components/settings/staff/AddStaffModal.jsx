import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
const defaultForm = {
  first_name: '',
  last_name: '',
  email: '',
  role: 'user',
  status: 'active',
};

const Req = () => <span className="text-destructive">*</span>;

export default function AddStaffModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const setSelect = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  const isValid = !!(form.first_name.trim() && form.last_name.trim() && form.email.trim() && form.role);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    await onAdd(form);
    setForm(defaultForm);
    setLoading(false);
    onClose();
  };

  // Discarding clears the draft so the next open starts fresh.
  const guard = useUnsavedChanges({
    draft: form,
    baseline: defaultForm,
    onClose: () => { setForm(defaultForm); onClose(); },
    saving: loading,
    enabled: open,
  });

  return (
    <ModalOverlay isOpen={open} onClose={guard.requestClose}>
      <div className="bg-card w-[34rem] max-w-[92vw] rounded-2xl shadow-xl border border-border max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold text-lg">Add Team Member</h2>
          </div>
          <CloseButton onClick={() => guard.requestClose()} />
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm mb-1.5 block">First Name <Req /></Label>
              <Input placeholder="Alice" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Last Name <Req /></Label>
              <Input placeholder="Smith" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm mb-1.5 block">Email Address <Req /></Label>
              <Input type="email" placeholder="alice@organisation.org" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Role <Req /></Label>
              <Select value={form.role} onValueChange={setSelect('role')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? 'Adding...' : 'Add Team Member'}
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}