import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import EditFooterActions from '@/components/shared/EditFooterActions';
import CircleStepper from '@/components/board/workplan/CircleStepper';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { LoaderOne } from '@/components/ui/loaders';
import { listSkills, listMemberSkills, setMemberSkills } from '@/lib/boardSkills';
import { listCategories, listOptions, listMemberAttributes, setMemberAttributes } from '@/lib/boardCategories';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import MemberSkillsView from './MemberSkillsView';
import MemberSkillsEditor from './MemberSkillsEditor';
import MemberCompositionView from './MemberCompositionView';
import MemberCompositionEditor from './MemberCompositionEditor';

const STEPS = ['Skills', 'Composition'];
const initials = (name = '') => name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
// Compare skills by id + level, attributes as sorted id lists (empty lists dropped).
const snapshot = (v) => ({
  rows: (v?.rows || []).map((r) => `${r.skill_id}:${r.level}`).sort(),
  attrs: Object.fromEntries(Object.entries(v?.attrs || {}).filter(([, ids]) => ids?.length).map(([k, ids]) => [k, [...ids].sort()])),
});
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * One pane for a board member, in two steps: Skills and Composition. Opens view-only and switches to
 * editing in place. Each step saves (or cancels) only its own fields; the pane returns to view-only
 * once neither step has unsaved changes.
 */
export default function MemberSkillsPane({ person, isOpen, onClose }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState([]);
  const [attrSelections, setAttrSelections] = useState({});
  const [baseline, setBaseline] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data: allSkills = [], isLoading: skillsLoading } = useQuery({ queryKey: ['boardSkills'], queryFn: listSkills, enabled: isOpen });
  const { data: memberSkills = [], isLoading: memberSkillsLoading } = useQuery({ queryKey: ['memberSkills'], queryFn: listMemberSkills, enabled: isOpen });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({ queryKey: ['boardCategories'], queryFn: listCategories, enabled: isOpen });
  const { data: options = [] } = useQuery({ queryKey: ['boardCategoryOptions'], queryFn: listOptions, enabled: isOpen });
  const { data: memberAttributes = [] } = useQuery({ queryKey: ['memberAttributes'], queryFn: listMemberAttributes, enabled: isOpen });
  const attributeCategories = categories.filter((c) => c.kind !== 'skills');
  const loading = skillsLoading || memberSkillsLoading || categoriesLoading;

  useEffect(() => { if (isOpen) { setEditing(false); setStep(0); } }, [isOpen, person?.id]);

  // Saved values feed the view and the edit baseline; a background refetch never overwrites edits in progress.
  useEffect(() => {
    if (!isOpen || !person || editing) return;
    const initialRows = memberSkills.filter((m) => m.person_id === person.id).map((m) => ({ skill_id: m.skill_id, skill_name: m.skill_name, level: m.level }));
    const sel = {};
    memberAttributes.filter((a) => a.person_id === person.id).forEach((a) => { (sel[a.category_id] ||= []).push(a.option_id); });
    setRows(initialRows); setAttrSelections(sel); setBaseline({ rows: initialRows, attrs: sel });
  }, [isOpen, person, memberSkills, memberAttributes, editing]);

  const draft = { rows, attrs: attrSelections };
  const { requestClose, dialog } = useUnsavedChanges({
    draft, baseline, onClose, saving: busy, select: snapshot, enabled: isOpen && editing && !!baseline, subject: 'skill changes',
  });
  const draftSnap = snapshot(draft);
  const baseSnap = snapshot(baseline);
  const skillsDirty = !same(draftSnap.rows, baseSnap.rows);
  const compositionDirty = !same(draftSnap.attrs, baseSnap.attrs);
  const onSkills = step === 0;
  const dirty = onSkills ? skillsDirty : compositionDirty;
  // Edit mode ends only once the other step has nothing unsaved either.
  const otherDirty = onSkills ? compositionDirty : skillsDirty;

  const cancel = () => {
    if (onSkills) setRows(baseline.rows); else setAttrSelections(baseline.attrs);
    if (!otherDirty) setEditing(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      if (onSkills) {
        await setMemberSkills(person.id, rows);
        setBaseline((b) => ({ ...b, rows }));
        await qc.invalidateQueries({ queryKey: ['memberSkills'] });
      } else {
        const selections = attributeCategories.flatMap((cat) => (attrSelections[cat.id] || []).map((optionId) => {
          const opt = options.find((o) => o.id === optionId);
          return opt ? { category_id: cat.id, category_name: cat.name, option_id: opt.id, option_name: opt.name } : null;
        }).filter(Boolean));
        await setMemberAttributes(person.id, selections, categories);
        setBaseline((b) => ({ ...b, attrs: attrSelections }));
        await qc.invalidateQueries({ queryKey: ['memberAttributes'] });
      }
      if (!otherDirty) setEditing(false);
    } catch {
      // Stay in edit mode with the user's selections intact so nothing is lost.
      toast({ title: 'Could not save changes', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (!person) return null;

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="h-full bg-card shadow-2xl flex flex-col">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {initials(person.member_name)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">{person.member_name}</h2>
                  <p className="text-xs text-muted-foreground">{person.position || (editing ? 'Edit skills & composition' : 'Skills overview')}</p>
                </div>
              </div>
              <PaneIconHeaderActions showEdit={!editing && !loading} onEdit={() => setEditing(true)} onClose={() => requestClose()} />
            </div>
            <ViewModeHint className="mt-1.5" editing={editing} />
          </div>
          <div className="px-6 pt-4 shrink-0">
            <CircleStepper steps={STEPS} current={step} onStepClick={busy ? undefined : setStep} />
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading || !baseline ? (
              <div className="py-16 flex justify-center"><LoaderOne size="lg" /></div>
            ) : onSkills ? (
              editing
                ? <MemberSkillsEditor rows={rows} setRows={setRows} allSkills={allSkills} />
                : <MemberSkillsView rows={baseline.rows} />
            ) : editing ? (
              <MemberCompositionEditor attributeCategories={attributeCategories} options={options}
                attrSelections={attrSelections} setAttrSelections={setAttrSelections} />
            ) : (
              <MemberCompositionView attributeCategories={attributeCategories}
                attributes={memberAttributes.filter((a) => a.person_id === person.id)} />
            )}
          </div>
          <div className="flex items-center gap-3 px-6 py-4 border-t border-border shrink-0">
            {onSkills
              ? <Button variant="ghost" onClick={() => setStep(1)} disabled={busy}>Next Step</Button>
              : <Button variant="ghost" onClick={() => setStep(0)} disabled={busy}>Back</Button>}
            {editing && (
              <div className="ml-auto flex items-center gap-3">
                <EditFooterActions dirty={dirty} onCancel={cancel} onSave={save} saving={busy} />
              </div>
            )}
          </div>
        </div>
      </SlidePane>
    </>
  );
}