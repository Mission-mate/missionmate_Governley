import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { createStrategy, updateStrategy } from '@/lib/strategy';
import YearSelect from './YearSelect';
import CloseButton from '@/components/shared/CloseButton';
import { ColorPicker } from '@/components/programs/CreateProgramModal';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const EMPTY = { title: '', start_year: '', end_year: '', owner: '', color: 'blue' };

const toForm = (s) => s ? {
  title: s.title || '',
  start_year: s.start_year ? String(s.start_year) : '',
  end_year: s.end_year ? String(s.end_year) : '',
  owner: s.owner || '',
  color: s.color || 'blue',
} : EMPTY;

export default function StrategyModal({ isOpen, strategy, onClose, onSaved }) {
  const { toast } = useToast();
  const isEdit = !!strategy;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isOpen) setForm(toForm(strategy));
  }, [isOpen, strategy]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Strategy Title is required', variant: 'destructive' });
      return;
    }
    if (!form.start_year || !form.end_year) {
      toast({ title: 'Strategy Period is required', variant: 'destructive' });
      return;
    }
    if (Number(form.end_year) < Number(form.start_year)) {
      toast({ title: 'End Year must be after Start Year', variant: 'destructive' });
      return;
    }
    if (!form.owner.trim()) {
      toast({ title: 'Owner is required', variant: 'destructive' });
      return;
    }
    const payload = {
      title: form.title.trim(),
      start_year: Number(form.start_year),
      end_year: Number(form.end_year),
      owner: form.owner.trim(),
      color: form.color,
    };
    try {
      setSaving(true);
      if (isEdit) await updateStrategy(strategy.id, payload);
      else await createStrategy(payload);
      toast({ title: isEdit ? 'Strategy updated' : 'Strategy created' });
      await onSaved?.();
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to save strategy.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const guard = useUnsavedChanges({ draft: form, baseline: toForm(strategy), onClose, saving, enabled: isOpen });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-md">
      <div className="bg-background rounded-2xl shadow-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">{isEdit ? 'Edit strategy' : 'Create new strategy'}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Give your strategy a name and period</p>
          </div>
          <CloseButton onClick={() => guard.requestClose()} className="mt-0.5" />
        </div>

        <div className="px-6 py-2 space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">Strategy Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="e.g. 5 Year Strategic Plan" autoFocus />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Strategy Period <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              <YearSelect value={form.start_year} onChange={set('start_year')} placeholder="Start Year" />
              <YearSelect value={form.end_year} onChange={set('end_year')} placeholder="End Year" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Owner <span className="text-destructive">*</span></Label>
            <Input value={form.owner} onChange={(e) => set('owner')(e.target.value)} placeholder="e.g. CEO, Department, Division" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Strategy Colour <span className="text-destructive">*</span></Label>
            <ColorPicker value={form.color} onChange={set('color')} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={() => guard.requestClose()} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create strategy'}
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}