import React, { useState } from 'react';
import useEditMutex from '@/components/shared/useEditMutex';
import ArchiveLinkedDialog from '@/components/compliance/policies/ArchiveLinkedDialog';
import useFieldErrors from '@/hooks/useFieldErrors';
import { savePolicy, setPolicyStatus, childrenOf, PARENT_TYPE } from '@/lib/policies';
import { policyToForm, reviewHandlers, policyFormErrors, archivesLinked, eligibleParents } from '@/lib/policyForm';

/** Card-scoped inline editing for the policy Details tab — one card at a time. */
export default function usePolicyInlineEdit({ doc, docs, onSaved }) {
  const { editingSection, requestEdit, closeEdit, setDirty, editBlocked } = useEditMutex();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [askArchive, setAskArchive] = useState(false);
  const fieldErrors = useFieldErrors((f) => policyFormErrors(f, docs.find((d) => d.id === f.parent_id) || null), form);

  const children = childrenOf(docs, doc.id);
  const parent = form ? docs.find((d) => d.id === form.parent_id) || null : null;
  const update = (fn) => { setForm(fn); setDirty(); };
  const set = (k, v) => update((f) => ({ ...f, [k]: v }));

  const start = (key) => { requestEdit(key); setForm(policyToForm(doc)); setError(''); fieldErrors.reset(); };
  const cancel = () => { closeEdit(); setForm(null); setError(''); fieldErrors.reset(); };

  const persist = async (cascade) => {
    setAskArchive(false); setSaving(true);
    try {
      await savePolicy(doc.id, form, parent);
      if (cascade) await setPolicyStatus(doc.id, 'archived', true);
      await onSaved();
      cancel();
    } catch (e) {
      setError(`Couldn't save the policy: ${e.message}`);
    } finally { setSaving(false); }
  };
  const save = () => {
    setError('');
    if (!fieldErrors.check()) return;
    archivesLinked(doc, form, children) ? setAskArchive(true) : persist(false);
  };

  const dialog = (
    <ArchiveLinkedDialog isOpen={askArchive} count={children.filter((c) => c.status !== 'archived').length} onChoose={persist} onClose={() => setAskArchive(false)} />
  );

  return {
    editing: editingSection, blocked: editBlocked, start, cancel, save, saving, error, errors: fieldErrors.errors, dialog,
    form, set, parent, review: reviewHandlers(update), parents: eligibleParents(docs, doc, children, PARENT_TYPE),
  };
}