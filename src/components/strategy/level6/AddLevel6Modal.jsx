import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { useToast } from '@/components/ui/use-toast';
import { createBlock, updateBlock } from '@/lib/strategy';
import { cn } from '@/lib/utils';
import { healthStyle, HEALTH_OPTIONS } from '../level3/health';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, priorityStyle, statusStyle } from '../priority';
import DescriptionField from '../DescriptionField';
import BlockIdField from '../BlockIdField';
import { isBlockIdTaken } from '@/lib/strategy/blockId';
import { LEVELS } from '@/lib/strategyLayers';
import OwnerMultiField, { MODAL_OWNER_LABEL_CLASS } from '../OwnerMultiField';
import { parseOwners, serializeOwners } from '@/lib/strategy/ownerUtils';
import { validateMeta, hasErrors } from '@/lib/strategy/requiredMeta';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { pickFields } from '@/lib/unsavedChanges/pickFields';

const EMPTY = {
  custom_id: '', title: '', content: '', owners: [], status: '', health: '', priority: '',
};

/** Add / edit a Level 6 item — reporting details are configured later in Settings. */
export default function AddLevel6Modal({ isOpen, onClose, onSaved, strategyId, levelName, block, level = LEVELS.MEASURES }) {
  // Projects (Strategic Initiatives) are always tracked by Tasks & Milestones.
  const isProject = level === LEVELS.INITIATIVES;
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) { setForm(block ? { ...EMPTY, ...block, owners: parseOwners(block) } : EMPTY); setErrors({}); }
  }, [isOpen, block]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })); };

  const handleSave = async () => {
    const next = validateMeta(form);
    if (!form.title.trim()) next.title = 'Name is required';
    if (hasErrors(next)) { setErrors(next); return; }

    setSaving(true);
    try {
      if (await isBlockIdTaken(strategyId, form.custom_id, block?.id)) {
        setErrors({ custom_id: 'This ID already exists' });
        return;
      }
      // Reporting frequency is metadata configured later — never required here.
      const payload = {
        custom_id: (form.custom_id || '').trim(),
        title: form.title.trim(),
        content: form.content || '',
        ...serializeOwners(form.owners),
        status: form.status,
        health: form.health,
        priority: form.priority || '',
        ...(isProject ? { tracking_config: { enabled: true, method: 'completion', unit: '#' } } : {}),
      };
      if (block?.id) {
        await updateBlock(block.id, payload);
      } else {
        await createBlock({ ...payload, strategy_id: strategyId, level });
      }
      toast({ title: `${levelName} ${block ? 'updated' : 'added'}` });
      onSaved();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Something went wrong';
      toast({ title: 'Could not save', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const guard = useUnsavedChanges({
    draft: form,
    baseline: block ? { ...EMPTY, ...block, owners: parseOwners(block) } : EMPTY,
    select: pickFields(EMPTY, block ? [] : ['custom_id']),
    onClose,
    saving,
    enabled: isOpen,
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-lg">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">{block ? `Edit ${levelName}` : `Add New ${levelName}`}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {block ? `Update this ${levelName.toLowerCase()} and its details.` : `Create a new ${levelName.toLowerCase()} on the register.`}
            </p>
          </div>
          <CloseButton onClick={() => guard.requestClose()} className="ml-4 mt-0.5" />
        </div>

        {/* Body */}
        <div className="px-6 pb-5 space-y-4 overflow-y-auto">
          <BlockIdField
            strategyId={strategyId}
            level={level}
            levelName={levelName}
            value={form.custom_id}
            onChange={set('custom_id')}
            error={errors.custom_id}
            suggest={isOpen && !block}
          />
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
              placeholder={isProject ? 'e.g., Launch a new transformation project' : 'e.g., Increase the number of annual workshops delivered'}
              className={errors.title ? 'border-red-400' : ''}
              autoFocus
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <DescriptionField value={form.content} onChange={set('content')} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <OwnerMultiField value={form.owners || []} onChange={set('owners')} placeholder="Assign an owner" labelClassName={MODAL_OWNER_LABEL_CLASS} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Health <span className="text-red-500">*</span>
              </label>
              <Select value={form.health || undefined} onValueChange={set('health')}>
                <SelectTrigger className={errors.health ? 'border-red-400' : ''}><SelectValue placeholder="Select health..." /></SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((h) => (
                    <SelectItem key={h} value={h}>
                      <span className={cn('font-medium', healthStyle(h).text)}>{h}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.health && <p className="text-xs text-red-500 mt-1">{errors.health}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <Select value={form.status || undefined} onValueChange={set('status')}>
                <SelectTrigger className={errors.status ? 'border-red-400' : ''}><SelectValue placeholder="Select status..." /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', statusStyle(s))}>{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Priority</label>
              <Select value={form.priority || undefined} onValueChange={set('priority')}>
                <SelectTrigger><SelectValue placeholder="Select priority..." /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', priorityStyle(p))}>{p}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : block ? 'Save Changes' : 'Save'}
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}