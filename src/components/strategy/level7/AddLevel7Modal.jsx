import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { useToast } from '@/components/ui/use-toast';
import { createBlock, updateBlock } from '@/lib/strategy';
import { HEALTH_OPTIONS, DEFAULT_HEALTH, healthStyle } from '@/components/strategy/level3/health';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, priorityStyle, statusStyle } from '@/components/strategy/priority';
import DescriptionField from '@/components/strategy/DescriptionField';
import BlockIdField from '@/components/strategy/BlockIdField';
import { isBlockIdTaken } from '@/lib/strategy/blockId';
import { LEVELS } from '@/lib/strategyLayers';

import OwnerMultiField, { MODAL_OWNER_LABEL_CLASS } from '@/components/strategy/OwnerMultiField';
import { parseOwners, serializeOwners } from '@/lib/strategy/ownerUtils';
import { validateMeta, hasErrors } from '@/lib/strategy/requiredMeta';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { pickFields } from '@/lib/unsavedChanges/pickFields';

const EMPTY = { custom_id: '', title: '', content: '', owners: [], status: '', health: DEFAULT_HEALTH, priority: '' };

/** Add / edit a Level 7 item — centred modal matching the app's modal design. */
export default function AddLevel7Modal({ isOpen, onClose, onSaved, strategyId, levelName, block, level = LEVELS.ENABLERS }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(block ? { ...EMPTY, ...block, owners: parseOwners(block) } : EMPTY);
      setErrors({});
    }
  }, [isOpen, block]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

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
      const data = {
        custom_id: (form.custom_id || '').trim(),
        title: form.title.trim(),
        content: form.content,
        ...serializeOwners(form.owners),
        status: form.status,
        health: form.health,
        priority: form.priority || '',
      };
      if (block?.id) await updateBlock(block.id, data);
      else await createBlock({ ...data, strategy_id: strategyId, level });
      toast({ title: `${levelName} ${block ? 'updated' : 'added'}` });
      onSaved();
      onClose();
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
              {block ? `Update this ${levelName.toLowerCase()} and its details.` : `Create a new ${levelName.toLowerCase()} for this strategy.`}
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
              onChange={(e) => { set('title')(e.target.value); if (errors.title) setErrors({}); }}
              placeholder="e.g., Technology and digital infrastructure"
              className={errors.title ? 'border-red-400' : ''}
              autoFocus
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <DescriptionField value={form.content} onChange={set('content')} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <OwnerMultiField value={form.owners || []} onChange={set('owners')} placeholder="e.g., IT Department" labelClassName={MODAL_OWNER_LABEL_CLASS} />
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
            {saving ? 'Saving...' : block ? 'Save Changes' : `Add ${levelName}`}
          </Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}