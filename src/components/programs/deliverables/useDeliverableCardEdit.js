import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useDeliverablesApi } from '@/lib/programs/deliverableApiContext';

/** Independent inline edit state for one Deliverable overview card. */
export default function useDeliverableCardEdit(deliverable, fields, onSaved, validate, onEditingChange) {
  const { toast } = useToast();
  const api = useDeliverablesApi();
  const [form, setForm] = useState(null);
  useEffect(() => { onEditingChange?.(!!form); }, [!!form]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const start = () => { setForm(Object.fromEntries(fields.map(([k, def]) => [k, deliverable[k] ?? def]))); setErrors({}); };
  const cancel = () => { setForm(null); setErrors({}); };
  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const save = async () => {
    const e = validate?.(form) || {};
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await api.update(deliverable.id, form);
      await onSaved?.();
      setForm(null);
    } catch (err) {
      toast({ title: 'Could not save', description: err?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return { editing: !!form, form, errors, saving, set, start, cancel, save };
}