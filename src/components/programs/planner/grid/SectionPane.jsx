import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import SectionCard from '@/components/shared/SectionCard';
import FieldError from '@/components/shared/FieldError';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { FieldLabel } from '@/components/programs/CreateProgramModal';
import { deleteSection, nextOrder } from '@/lib/programs/plannerApi';
import PlannerPaneShell from './PlannerPaneShell';
import PaneFooter from './PaneFooter';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { SECTION_TOOLTIP } from '@/components/strategy/level5/tasks/detail/OverviewTab';

export default function SectionPane({ isOpen, section, startEditing, plannerId, sections, taskCount, onClose, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const baseline = section?.title || '';
  const guard = useUnsavedChanges({ draft: editing ? title : baseline, baseline, onClose, saving, enabled: isOpen, subject: 'section changes' });

  // Reset when a section opens — a refreshed copy of the same section (after Save) keeps edit mode.
  useEffect(() => { if (isOpen) { setEditing(!section || startEditing); setTitle(baseline); setError(''); } }, [isOpen, section?.id, startEditing]); // eslint-disable-line

  const save = async () => {
    if (!title.trim()) { setError('Section title is required.'); return; }
    setSaving(true);
    try {
    if (section) await base44.entities.PlannerSection.update(section.id, { title: title.trim() });
    else await base44.entities.PlannerSection.create({ planner_id: plannerId, title: title.trim(), order_index: nextOrder(sections) });
    await onSaved();
    } finally { setSaving(false); }
    if (section) { setTitle(title.trim()); setEditing(false); } else onClose();
  };

  // Cancel restores the saved title and returns to view mode.
  const cancel = () => (section ? (setTitle(baseline), setError(''), setEditing(false)) : guard.requestClose());

  return (
    <PlannerPaneShell isOpen={isOpen} onClose={guard.requestClose} saving={saving} editing={editing} onEdit={section ? () => setEditing(true) : null}
      title={section ? (editing ? 'Edit Section' : 'View Section') : 'New Section'}
      extra={<>{guard.dialog}<ConfirmDeleteDialog isOpen={confirm} title="Delete Section" requireKeyword="DELETE" overlayClassName="z-[110]"
        message={`This permanently deletes the section and its ${taskCount} task(s). This action cannot be undone.`}
        onClose={() => setConfirm(false)} onConfirm={async () => { await deleteSection(section); setConfirm(false); onSaved(); onClose(); }} /></>}
      footer={<PaneFooter onDelete={section ? () => setConfirm(true) : null} onCancel={cancel} onSave={save} saving={saving} saveLabel={section ? 'Save Changes' : 'Create Section'}
        dirty={title !== baseline} />}>
      <SectionCard title="Section Details">
        <FieldLabel required error={error}><span className="inline-flex items-center gap-1">Section Title <InfoTooltip text={SECTION_TOOLTIP} /></span></FieldLabel>
        {editing ? (
          <>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }} placeholder="e.g. Planning and Scoping" className="bg-background" autoFocus />
            <FieldError msg={error} />
          </>
        ) : <p className="text-sm text-foreground">{section?.title}</p>}
        {section && <p className="text-xs text-muted-foreground mt-3">{taskCount} task{taskCount === 1 ? '' : 's'} in this section</p>}
      </SectionCard>
    </PlannerPaneShell>
  );
}