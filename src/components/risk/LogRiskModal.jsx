import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { createRisk, previewRiskId, RiskDuplicateIdError, getRiskFieldConfig, fieldOptions } from '@/lib/riskApi';
import LogRiskFields from './LogRiskFields';

const EMPTY = {
  risk_id: '',
  date_raised: '',
  raised_by: '',
  title: '',
  description: '',
  category: '',
  risk_appetite: '',
  owner: '',
  status: 'Open',
  review_frequency: '',
  interval_value: '',
  interval_unit: 'Months',
  last_reviewed_date: '',
  next_review_date: '',
};

export default function LogRiskModal({ isOpen, onClose: closeNow, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [suggestedId, setSuggestedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [baseline, setBaseline] = useState(EMPTY);
  const reset = () => { setForm(EMPTY); setErrors({}); closeNow(); };
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: reset, saving, enabled: isOpen, subject: 'risk details',
  });

  const { data: fields = [] } = useQuery({ queryKey: ['riskFieldConfig'], queryFn: getRiskFieldConfig });
  const categoryOpts = fieldOptions(fields, 'category');

  // Pre-fill the server's suggested Risk ID when the pane opens. The suggestion is
  // display only: left unchanged (or blank), the server assigns the next available
  // ID on save. New risks always start as 'Open'.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setForm(EMPTY); setBaseline(EMPTY); setSuggestedId('');
    setErrors({});
    setSaving(false);
    previewRiskId().then((id) => {
      if (!active) return;
      setSuggestedId(id);
      setForm((prev) => (prev.risk_id ? prev : { ...prev, risk_id: id }));
      setBaseline((prev) => ({ ...prev, risk_id: id }));
    });
    return () => { active = false; };
  }, [isOpen]);

  const update = (fields) => {
    setForm((prev) => ({ ...prev, ...fields }));
    if ('risk_id' in fields) setErrors((prev) => ({ ...prev, risk_id: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Risk Title is required';
    if (!form.owner.trim()) e.owner = 'Risk Owner is required';
    if (!form.category.trim()) e.category = 'Risk Category is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleClose = () => requestClose();

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const riskId = form.risk_id.trim();
    try {
      await createRisk({
        date_raised: form.date_raised || null,
        raised_by: form.raised_by.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        risk_appetite: form.risk_appetite || '',
        owner: form.owner.trim(),
        status: form.status,
        review_frequency: form.review_frequency,
        last_reviewed_date: form.last_reviewed_date || null,
        next_review_date: form.next_review_date || null,
      }, { riskId, auto: !riskId || riskId === suggestedId });
      onSaved?.();
      reset();
    } catch (err) {
      if (err instanceof RiskDuplicateIdError) {
        setErrors((prev) => ({ ...prev, risk_id: err.message }));
        return;
      }
      toast({ title: 'Error', description: 'Failed to log risk.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePane isOpen={isOpen} onClose={handleClose}>
      {dialog}
      <div className="flex flex-col h-full bg-card border-l border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">Log New Risk</h2>
          <PaneIconHeaderActions showEdit={false} onClose={handleClose} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <LogRiskFields
            form={form}
            update={update}
            errors={errors}
            categoryOptions={categoryOpts}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Log New Risk'}
          </Button>
        </div>
      </div>
    </SlidePane>
  );
}