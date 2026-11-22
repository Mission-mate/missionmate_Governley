import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModalOverlay from '@/components/ui/ModalOverlay';
import SlidePane from '@/components/ui/SlidePane';
import CloseButton from '@/components/shared/CloseButton';
import { LoaderOne } from '@/components/ui/loaders';
const EMPTY = {
  title: '',
  grant_id: '',
  provider: '',
  due_date: '',
  status: 'not_started',
  responsible_person: '',
  reporting_type: '',
};

export default function AddReportingModal({ isOpen, onClose: closeNow, grants, organizationId, onSaved, obligation }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffList, setShowStaffList] = useState(false);

  const isEditing = !!obligation;
  const [baseline, setBaseline] = useState(EMPTY);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: closeNow, saving, enabled: isOpen, subject: 'reporting obligation changes',
  });
  const onClose = () => requestClose();

  // Fetch all users for staff dropdown
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => base44.entities.User.list(),
  });

  const staffList = users.map(u => ({ id: u.id, name: u.full_name, email: u.email }));

  const filteredStaff = staffList.filter(s =>
    s.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(staffSearch.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      if (obligation) {
        const grant = grants.find(g => g.id === obligation.grant_id);
        const init = {
          title: obligation.title || '',
          grant_id: obligation.grant_id || '',
          provider: grant?.provider || '',
          due_date: obligation.due_date || '',
          status: obligation.status || 'not_started',
          responsible_person: obligation.responsible_person || '',
          reporting_type: obligation.reporting_type || '',
        };
        setForm(init); setBaseline(init);
      } else {
        setForm(EMPTY); setBaseline(EMPTY);
      }
      setErrors({});
      setStaffSearch('');
      setShowStaffList(false);
    }
  }, [isOpen, obligation]);

  // Auto-populate when grant changes
  const handleGrantChange = (grantId) => {
    const grant = grants.find(g => g.id === grantId);
    setForm(prev => ({
      ...prev,
      grant_id: grantId,
      provider: grant?.provider || '',
      responsible_person: grant?.internal_owner || prev.responsible_person,
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.grant_id) e.grant_id = 'Please select a grant';
    if (!form.reporting_type?.trim()) e.reporting_type = 'Reporting type is required';
    if (!form.status) e.status = 'Status is required';
    if (!form.due_date) e.due_date = 'Due date is required';
    if (!form.responsible_person?.trim()) e.responsible_person = 'Responsible person is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      grant_id: form.grant_id,
      organization_id: organizationId,
      reporting_type: form.reporting_type,
      status: form.status,
      due_date: form.due_date || null,
      responsible_person: form.responsible_person || null,
      notes: '',
    };

    if (isEditing) {
      await base44.entities.ReportingObligation.update(obligation.id, payload);
    } else {
      await base44.entities.ReportingObligation.create(payload);
    }

    setSaving(false);
    onSaved();
  };

  const selectStaff = (s) => {
    setForm(p => ({ ...p, responsible_person: s.name }));
    setStaffSearch('');
    setShowStaffList(false);
  };

  const fields = (
    <div className="space-y-4">
      {/* Reporting Obligation Title */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          Reporting Obligation Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g., Final Financial Report"
          className={errors.title ? 'border-red-400' : ''}
          autoFocus
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Grant Linked */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          Grant Linked <span className="text-red-500">*</span>
        </label>
        <Select value={form.grant_id} onValueChange={handleGrantChange}>
          <SelectTrigger className={errors.grant_id ? 'border-red-400' : ''}>
            <SelectValue placeholder="Select a grant..." />
          </SelectTrigger>
          <SelectContent>
            {grants.map(g => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.grant_id && <p className="text-xs text-red-500 mt-1">{errors.grant_id}</p>}
      </div>

      {/* Provider (auto-populated, read-only) */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Provider</label>
        <Input
          value={form.provider}
          readOnly
          placeholder="Auto-populated from selected grant"
          className="bg-muted/30 text-muted-foreground cursor-default"
        />
      </div>

      {/* Reporting Type + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Reporting Type <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.reporting_type}
            onChange={e => setForm(p => ({ ...p, reporting_type: e.target.value }))}
            placeholder="Report, Acquittal, Milestone..."
            className={errors.reporting_type ? 'border-red-400' : ''}
          />
          {errors.reporting_type && <p className="text-xs text-red-500 mt-1">{errors.reporting_type}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Status <span className="text-red-500">*</span>
          </label>
          <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
            <SelectTrigger className={errors.status ? 'border-red-400' : ''}>
              <SelectValue placeholder="Not Started" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="complete">Completed</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
        </div>
      </div>

      {/* Due Date + Responsible Person */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Due Date <span className="text-red-500">*</span>
          </label>
          <DateField
            value={form.due_date}
            onChange={v => setForm(p => ({ ...p, due_date: v }))}
            placeholder="DD MMM YYYY"
            className={errors.due_date ? 'border border-red-400 rounded-md' : ''}
          />
          {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>}
        </div>
        <div className="relative">
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Responsible Person <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.responsible_person}
            onChange={e => {
              setForm(p => ({ ...p, responsible_person: e.target.value }));
              setStaffSearch(e.target.value);
              setShowStaffList(true);
            }}
            onFocus={() => { setStaffSearch(form.responsible_person); setShowStaffList(true); }}
            onBlur={() => setTimeout(() => setShowStaffList(false), 150)}
            placeholder="e.g., Jane Doe"
            className={errors.responsible_person ? 'border-red-400' : ''}
          />
          {errors.responsible_person && <p className="text-xs text-red-500 mt-1">{errors.responsible_person}</p>}
          {showStaffList && loadingUsers && (
            <div className="animate-dropdown-enter absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-20 flex items-center justify-center py-3">
              <LoaderOne size="sm" />
            </div>
          )}
          {showStaffList && !loadingUsers && filteredStaff.length > 0 && (
            <div className="animate-dropdown-enter absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-20 max-h-36 overflow-y-auto">
              {filteredStaff.map(s => (
                <button
                  key={s.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/20 transition-colors"
                  onMouseDown={() => selectStaff(s)}
                >
                  <span className="font-medium">{s.name}</span>
                  {s.email && <span className="text-muted-foreground ml-1.5 text-xs">{s.email}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={handleSave} disabled={saving} className="bg-primary text-white">
        {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Obligation'}
      </Button>
    </div>
  );

  // Edit → right slide-in pane
  if (isEditing) {
    return (
      <SlidePane isOpen={isOpen} onClose={onClose}>
        {dialog}
        <div className="h-full bg-white flex flex-col shadow-2xl">
          <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
            <div>
              <h2 className="text-lg font-bold text-foreground">Edit Reporting Obligation</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Update this reporting obligation and its linked grant.</p>
            </div>
            <CloseButton onClick={onClose} className="ml-4 mt-0.5" />
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {fields}
          </div>
          <div className="px-6 py-4 border-t border-border shrink-0">
            {footer}
          </div>
        </div>
      </SlidePane>
    );
  }

  // Add → center modal
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-lg">
      {dialog}
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-foreground">Add Reporting Obligation</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Create a new reporting obligation and link it to a grant.</p>
          </div>
          <CloseButton onClick={onClose} className="ml-4 mt-0.5" />
        </div>
        <div className="mt-5">
          {fields}
        </div>
        <div className="mt-6">
          {footer}
        </div>
      </div>
    </ModalOverlay>
  );
}