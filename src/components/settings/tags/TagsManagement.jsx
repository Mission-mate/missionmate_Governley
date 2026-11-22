import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TagModal from './TagModal';
import TagsTable from './TagsTable';
import SingleRecordActionBar from '@/components/shared/SingleRecordActionBar';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { useToast } from '@/components/ui/use-toast';

export default function TagsManagement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modal, setModal] = useState({ open: false, mode: 'create', tag: null });
  const [deleteTag, setDeleteTag] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const { data: tags = [], isLoading, ...read } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.Tag.list(),
  });

  const selectedTag = tags.find((t) => t.id === selectedId) || null;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tag.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tag.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  // Deleting a tag also strips it from every contact, member and smart group
  // that references it, so no record is left pointing at a tag that's gone.
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('syncTagReferences', {
      operation: 'deleteTag',
      tagId: id,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['contacts-all'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['smart-lists'] });
    },
  });

  const openCreate = () => setModal({ open: true, mode: 'create', tag: null });
  const openView = (tag) => setModal({ open: true, mode: 'view', tag });
  const openEdit = (tag) => setModal({ open: true, mode: 'edit', tag });
  const closeModal = () => setModal({ open: false, mode: 'create', tag: null });

  const handleSave = async (formData) => {
    if (modal.mode === 'create') {
      await createMutation.mutateAsync(formData);
    } else if (modal.mode === 'edit') {
      await updateMutation.mutateAsync({ id: modal.tag.id, data: formData });
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteTag) return;
    try {
      await deleteMutation.mutateAsync(deleteTag.id);
      if (selectedId === deleteTag.id) setSelectedId(null);
      toast({ title: `"${deleteTag.name}" deleted` });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete tag.', variant: 'destructive' });
    } finally {
      setDeleteTag(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-1">Tags Management</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Create and manage custom tags globally for the application.
      </p>

      <div className="border border-border rounded-xl bg-card p-6">
        {/* Card header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Tags Management</h2>
            <p className="text-sm text-muted-foreground">Create and manage custom tags to organize your records.</p>
          </div>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add Tag
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <ModuleLoader />
          ) : read.isLoadingError ? (
            <LoadError failure={read} title="Couldn’t load tags" />
          ) : (
            <TagsTable tags={tags} selectedId={selectedId} onSelect={setSelectedId} onView={openView} />
          )}
        </div>
      </div>

      <SingleRecordActionBar
        open={!!selectedTag && !modal.open && !deleteTag}
        onView={() => openView(selectedTag)}
        onEdit={() => openEdit(selectedTag)}
        onDelete={() => setDeleteTag(selectedTag)}
        onClear={() => setSelectedId(null)}
      />

      <TagModal
        open={modal.open}
        mode={modal.mode}
        tag={modal.tag}
        existingTags={tags}
        onClose={closeModal}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        isOpen={!!deleteTag}
        title="Delete tag"
        message={`"${deleteTag?.name}" will be removed from every contact, member and smart group that uses it. This can't be undone.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTag(null)}
      />
    </div>
  );
}