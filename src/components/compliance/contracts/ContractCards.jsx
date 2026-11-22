import React, { useState } from 'react';
import { guardSave } from '@/lib/saveGuard';
import AssetSection from '@/components/compliance/assets/AssetSection';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';
import useDirtyFlag from '@/hooks/useDirtyFlag';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { getAssetCustomColumns } from '@/lib/assetRegister';
import useFieldErrors from '@/hooks/useFieldErrors';
import { pickContract, contractFieldErrors, contractCodeErrors, updateContract, getContractTypes } from '@/lib/contractRegister';
import ContractSections from './ContractSections';
import ContractFinancials from './ContractFinancials';

const renderers = {
  details: (p) => <ContractSections {...p} only="details" bare />,
  dates: (p) => <ContractSections {...p} only="dates" bare />,
  parties: (p) => <ContractSections {...p} only="parties" bare />,
  financials: (p) => (
    <>
      <p className="-mt-4 mb-6 pb-5 border-b border-border text-sm text-muted-foreground">Record the contract value and how payments are scheduled.</p>
      <ContractFinancials {...p} />
    </>
  ),
  additional: (p) => <AssetCustomFields values={p.values} set={(k, v) => p.setForm((f) => ({ ...f, [k]: v }))} edit={p.edit} columns={p.columns} />,
};

/** Detail-page cards with one-at-a-time inline edit, matching the Fixed Asset Register. */
export default function ContractCards({ contract, register, cards, onSaved }) {
  const base = pickContract(contract);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(base);
  const [saving, setSaving] = useState(false);
  const fe = useFieldErrors(contractFieldErrors, draft);
  const columns = getAssetCustomColumns(register);
  const typeOptions = getContractTypes(register);
  const shown = cards.filter((c) => c.key !== 'additional' || columns.length > 0);

  useDirtyFlag(!!editing && !draftEqual(draft, base));

  const start = (key) => { setDraft(pickContract(contract)); fe.reset(); setEditing(key); };
  const save = guardSave(setSaving, async () => {
    if (!fe.check()) return;
    setSaving(true);
    const dup = await contractCodeErrors(contract.register_id, draft, contract.id);
    if (Object.keys(dup).length) { setSaving(false); return fe.addErrors(dup); }
    await updateContract(contract.id, draft);
    await onSaved();
    setSaving(false); setEditing(null);
  });

  const renderCard = ({ key, title, full }) => {
    const isEditing = editing === key;
    return (
      <AssetSection key={key} title={title} className={full ? 'xl:col-span-2' : ''}
        editing={isEditing} locked={!!editing} onEdit={() => start(key)}
        onCancel={() => { setEditing(null); fe.reset(); }} onSave={save} saving={saving}>
        {renderers[key]({ values: isEditing ? draft : base, setForm: setDraft, edit: isEditing, typeOptions, columns, errors: fe.errors })}
      </AssetSection>
    );
  };
  // Cards flagged `side` stack in the right column, beside the first main card.
  const side = shown.filter((c) => c.side);
  const main = shown.filter((c) => !c.side);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {main.slice(0, 1).map(renderCard)}
      {side.length > 0 && <div className="flex flex-col gap-5">{side.map(renderCard)}</div>}
      {main.slice(1).map(renderCard)}
    </div>
  );
}