import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Settings2, Share2, MonitorPlay } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { LoaderOne } from '@/components/ui/loaders';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { useToast } from '@/components/ui/use-toast';
import { useCustomFields } from '@/hooks/useCustomFields';
import { FORM_CONFIG_SLUG, reconcileLayout, makeQuestion, isLockedSystemField } from '@/lib/membershipForm';
import StructureSelector from './form/StructureSelector';
import FormSettingsPane from './form/FormSettingsPane';
import ShareFormModal from './form/ShareFormModal';
import FormCanvas from './form/FormCanvas';
import FieldSettingsPane from './form/FieldSettingsPane';
import SandboxPreviewOverlay from './form/SandboxPreviewOverlay';
import SectionSaveFooter from './form/SectionSaveFooter';
import SectionCard from '@/components/shared/SectionCard';
import useDirtyFlag from '@/hooks/useDirtyFlag';

export default function MembershipFormBuilderTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { fields: customFields, isLoading: cfLoading } = useCustomFields('membership');

  const { data: structures = [], isLoading: structLoading, ...structRead } = useQuery({
    queryKey: ['membership_structures'],
    queryFn: () => base44.entities.MembershipStructure.list('-created_date')
  });

  const { data: configRecord, isLoading: cfgLoading, ...cfgRead } = useQuery({
    queryKey: ['membership_form_config'],
    queryFn: async () => {
      const recs = await base44.entities.MembershipFormConfig.filter({ slug: FORM_CONFIG_SLUG });
      return recs[0] || null;
    }
  });

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [builderDirty, setBuilderDirty] = useState(false);
  const [plansDirty, setPlansDirty] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  // Pane state for adding / editing a question. `draft` is a not-yet-committed
  // question when adding; editing an existing field passes the field through.
  const [pane, setPane] = useState({ open: false, field: null, isNew: false });
  // Page settings, builder and plans all feed one page-level dirty flag.
  useDirtyFlag((dirty || builderDirty || plansDirty) && !saving);

  const buildForm = () => ({
      id: configRecord?.id || null,
      title: configRecord?.title || 'Become a Member',
      description: configRecord?.description || '',
      organisation_name: configRecord?.organisation_name || '',
      support_email: configRecord?.support_email || '',
      social_links: configRecord?.social_links || {},
      banner_url: configRecord?.banner_url || '',
      success_message: configRecord?.success_message || 'Thank you! Your membership application has been received and is pending review.',
      status: configRecord?.status || 'active',
      selected_structure_ids: configRecord?.selected_structure_ids || [],
      structure_rules: configRecord?.structure_rules || [],
    field_layout: reconcileLayout(configRecord?.field_layout, customFields)
  });

  // Initialise local state once data is loaded.
  useEffect(() => {
    if (cfLoading || cfgLoading) return;
    setForm(buildForm());
    setDirty(false);
    setBuilderDirty(false);
    setPlansDirty(false);
  }, [configRecord, customFields, cfLoading, cfgLoading]);

  // Discard unsaved changes and restore the last saved configuration.
  const handleCancel = () => {
    setForm(buildForm());
    setDirty(false);
    setBuilderDirty(false);
    setPlansDirty(false);
  };

  const failure = loadFailure(structRead, cfgRead);
  if (failure.isLoadingError) return <LoadError failure={failure} title="Couldn’t load the membership form" />;

  if (!form) {
    return (
      <div className="py-12 flex justify-center">
        <LoaderOne />
      </div>);

  }

  const update = (key, value) => {setDirty(true);setForm((f) => ({ ...f, [key]: value }));};

  // Structures exposed on the form.
  const formStructures = structures.filter(
    (s) => s.status !== 'archived' && form.selected_structure_ids.includes(s.id)
  );

  // Fields currently placed on the form, in display order.
  const canvasFields = form.field_layout.filter((f) => f.enabled);

  const setLayout = (next) => {setBuilderDirty(true);update('field_layout', next);};

  // Open the pane with a fresh blank question — nothing is committed until Save.
  const openAddQuestion = () => setPane({ open: true, field: makeQuestion(), isNew: true });

  // Open the pane to edit an existing placed field.
  const openEditField = (field) => setPane({ open: true, field, isNew: false });

  const closePane = () => setPane({ open: false, field: null, isNew: false });

  // Commit a question from the pane: append new ones, replace edited ones.
  const savePaneField = (updated) => {
    if (pane.isNew) {
      const placed = form.field_layout.filter((f) => f.enabled);
      const rest = form.field_layout.filter((f) => !f.enabled);
      setLayout([...placed, { ...updated, enabled: true }, ...rest]);
    } else {
      const next = isLockedSystemField(updated) ?
      { ...updated, enabled: true, mandatory: true, map_to_field: updated.field_id } :
      updated;
      setLayout(form.field_layout.map((f) => f.field_id === next.field_id ? next : f));
    }
  };

  // Remove a field from the canvas. Locked system fields can never be removed;
  // inline questions are deleted outright; other system / legacy custom fields
  // are just disabled so they can be re-added.
  const removeField = (field) => {
    if (isLockedSystemField(field)) return;
    if (field.kind === 'custom' && !customFields.some((cf) => cf.id === field.field_id)) {
      setLayout(form.field_layout.filter((f) => f.field_id !== field.field_id));
      return;
    }
    setLayout(form.field_layout.map((f) =>
    f.field_id === field.field_id ? { ...f, enabled: false, hidden: false } : f));
  };

  // Reorder placed fields within the canvas (drag & drop).
  const reorderFields = (from, to) => {
    const placed = form.field_layout.filter((f) => f.enabled);
    const rest = form.field_layout.filter((f) => !f.enabled);
    const next = [...placed];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setLayout([...next, ...rest]);
  };

  const toggleStructure = (id) => {
    setPlansDirty(true);
    const removing = form.selected_structure_ids.includes(id);
    update('selected_structure_ids', removing ?
    form.selected_structure_ids.filter((x) => x !== id) :
    [...form.selected_structure_ids, id]);
    // Drop the structure from any field's plan visibility when it's removed.
    if (removing) {
      setForm((f) => ({
        ...f,
        field_layout: (f.field_layout || []).map((fl) =>
        Array.isArray(fl.visibility_plans) && fl.visibility_plans.includes(id) ?
        { ...fl, visibility_plans: fl.visibility_plans.filter((x) => x !== id) } :
        fl
        )
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        slug: FORM_CONFIG_SLUG,
        title: form.title.trim() || 'Become a Member',
        description: form.description.trim(),
        organisation_name: (form.organisation_name || '').trim(),
        support_email: (form.support_email || '').trim(),
        social_links: form.social_links || {},
        banner_url: form.banner_url || '',
        success_message: form.success_message.trim(),
        status: form.status,
        selected_structure_ids: form.selected_structure_ids,
        structure_rules: form.structure_rules,
        field_layout: form.field_layout
      };
      if (form.id) await base44.entities.MembershipFormConfig.update(form.id, payload);else
      {
        const created = await base44.entities.MembershipFormConfig.create(payload);
        update('id', created.id);
      }
      qc.invalidateQueries({ queryKey: ['membership_form_config'] });
      toast({ title: 'Changes saved', description: 'Your membership page is live and up to date.' });
      setDirty(false);
      setBuilderDirty(false);
      setPlansDirty(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save the membership form.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Membership Page</h3>
          <p className="text-muted-foreground text-xs">Submissions create new member records with Pending status for admin approval</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => setShowSettings(true)} className="gap-1.5">
            <Settings2 className="w-4 h-4" /> Settings
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowShare(true)} className="gap-1.5">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowSandbox(true)} className="gap-1.5">
            <MonitorPlay className="w-4 h-4" /> Preview
          </Button>
          {!dirty &&
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          }
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Field builder */}
        <SectionCard className="space-y-3 lg:col-span-8 min-w-0 shadow-sm">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Membership Form Builder</h4>
            <p className="text-xs text-muted-foreground">Add questions to your membership form. Use the settings to choose question type, add options and map it to a member field.</p>
          </div>

          <FormCanvas
            canvasFields={canvasFields}
            plans={formStructures}
            customFields={customFields}
            onEdit={openEditField}
            onRemove={removeField}
            onReorder={reorderFields}
            onAddQuestion={openAddQuestion} />

          {builderDirty &&
          <SectionSaveFooter onCancel={handleCancel} onSave={handleSave} saving={saving} />
          }
        </SectionCard>

        {/* Structures */}
        <SectionCard className="space-y-3 lg:col-span-4 min-w-0 shadow-sm">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Membership Plans</h4>
            <p className="text-xs text-muted-foreground">Select which membership plans should appear on the Membership Page</p>
          </div>
          <div className="max-h-[560px] overflow-y-auto pr-1">
            <StructureSelector
              structures={structLoading ? [] : structures.filter((s) => s.status !== 'archived')}
              selectedIds={form.selected_structure_ids}
              onToggle={toggleStructure}
              gridClassName="grid-cols-1" />
          </div>

          {plansDirty &&
          <SectionSaveFooter onCancel={handleCancel} onSave={handleSave} saving={saving} />
          }
        </SectionCard>
      </div>

      <FieldSettingsPane
        isOpen={pane.open}
        field={pane.field}
        isNew={pane.isNew}
        plans={formStructures}
        customFields={customFields}
        takenMappings={canvasFields.
        filter((f) => f.field_id !== pane.field?.field_id).
        map((f) => f.map_to_field).
        filter(Boolean)}
        onClose={closePane}
        onSave={savePaneField} />

      <FormSettingsPane
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onCancel={() => { handleCancel(); setShowSettings(false); }}
        form={form}
        update={update}
        onRestore={(values) => setForm((f) => ({ ...f, ...values }))}
        onSave={handleSave}
        saving={saving} />
      

      <ShareFormModal isOpen={showShare} onClose={() => setShowShare(false)} />

      {showSandbox && <SandboxPreviewOverlay onClose={() => setShowSandbox(false)} />}

    </div>);

}