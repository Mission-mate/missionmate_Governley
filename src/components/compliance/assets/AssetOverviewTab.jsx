import React, { useState } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { getAssetOptions, getAssetCustomColumns, assetErrors } from '@/lib/assetRegister';
import useFieldErrors from '@/hooks/useFieldErrors';
import AssetCustomFields from './AssetCustomFields';
import { updateAsset, isAssetIdTaken } from '@/lib/assetRegisterApi';
import AssetSection from './AssetSection';
import AssetDetailsFields from './AssetDetailsFields';
import AdditionalDetailsFields from './AdditionalDetailsFields';
import DepreciationFields from './DepreciationFields';
import useDirtyFlag from '@/hooks/useDirtyFlag';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';

const SECTIONS = [
  { key: 'details', title: 'Asset Details', Fields: AssetDetailsFields },
  { key: 'additional', title: 'Additional Details', Fields: AdditionalDetailsFields },
  { key: 'depreciation', title: 'Depreciation Details', Fields: DepreciationFields, full: true },
];

export default function AssetOverviewTab({ asset, register, onSaved }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(asset);
  const [saving, setSaving] = useState(false);
  const fe = useFieldErrors(assetErrors, draft);
  const options = getAssetOptions(register);
  const customColumns = getAssetCustomColumns(register);
  const sections = customColumns.length
    ? [...SECTIONS, { key: 'custom', title: 'Custom Details', Fields: AssetCustomFields, full: true }]
    : SECTIONS;

  useDirtyFlag(!!editing && !draftEqual(draft, asset));

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const start = (key) => { setDraft(asset); fe.reset(); setEditing(key); };
  const cancel = () => { setEditing(null); fe.reset(); };

  const save = guardSave(setSaving, async () => {
    if (!fe.check()) return;
    setSaving(true);
    if (await isAssetIdTaken(asset.register_id, draft.asset_id, asset.id)) {
      setSaving(false);
      return fe.addErrors({ asset_id: 'This Asset ID is already in use in this register.' });
    }
    await updateAsset(asset.id, draft);
    await onSaved();
    setSaving(false);
    setEditing(null);
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {sections.map(({ key, title, Fields, full }) => {
        const isEditing = editing === key;
        return (
          <AssetSection
            key={key}
            title={title}
            className={full ? 'xl:col-span-2' : ''}
            editing={isEditing}
            locked={!!editing}
            onEdit={() => start(key)}
            onCancel={cancel}
            onSave={save}
            saving={saving}
          >
            <Fields values={isEditing ? draft : asset} set={set} edit={isEditing} options={options} columns={customColumns} errors={isEditing ? fe.errors : undefined} />
          </AssetSection>
        );
      })}
    </div>
  );
}