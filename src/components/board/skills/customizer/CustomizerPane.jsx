import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CustomisePaneTitle from '@/components/shared/customizer/CustomisePaneTitle';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import CloseButton from '@/components/shared/CloseButton';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { LoaderOne } from '@/components/ui/loaders';
import { listSkills, createSkill, renameSkill, deleteSkill, reorderSkills } from '@/lib/boardSkills';
import {
  listCategories, listOptions, createCategory, renameCategory, updateCategoryCardinality, deleteCategory,
  createOption, renameOption, deleteOption, reorderOptions, invalidateBoardComposition,
} from '@/lib/boardCategories';
import { toast } from '@/components/ui/use-toast';
import CategoryRow from './CategoryRow';
import AddCategoryForm from './AddCategoryForm';
import ReconcileOrphansButton from './ReconcileOrphansButton';

export default function CustomizerPane({ isOpen, onClose }) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const { data: categories = [], isLoading } = useQuery({ queryKey: ['boardCategories'], queryFn: listCategories, enabled: isOpen });
  const { data: options = [] } = useQuery({ queryKey: ['boardCategoryOptions'], queryFn: listOptions, enabled: isOpen });
  const { data: skills = [] } = useQuery({ queryKey: ['boardSkills'], queryFn: listSkills, enabled: isOpen });

  const invalidate = () => invalidateBoardComposition(qc);

  const apiFor = (cat) => cat.kind === 'skills'
    ? { options: skills, create: (name) => createSkill({ name, is_required: true, order_index: skills.length }), rename: renameSkill, remove: deleteSkill, reorder: reorderSkills }
    : { options: options.filter((o) => o.category_id === cat.id), create: (name) => createOption({ category_id: cat.id, name, order_index: options.filter((o) => o.category_id === cat.id).length }), rename: renameOption, remove: deleteOption, reorder: reorderOptions };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="h-full bg-white dark:bg-card shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-border">
          <CustomisePaneTitle title="Customise Composition" subtitle="Manage skills and attribute categories used to map board composition." />
          <CloseButton onClick={onClose} className="shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
            <p className="text-xs text-muted-foreground mt-0.5">System categories (🔒) cannot be renamed or deleted. Expand a category to manage its options.</p>
          </div>
          {isLoading ? <div className="py-10 flex justify-center"><LoaderOne size="sm" /></div> : (
                  <div className="space-y-2">
                    {categories.map((c) => (
                      <CategoryRow key={c.id} category={c} api={apiFor(c)} expanded={expandedId === c.id}
                        onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        onRename={async (cat, name) => { await renameCategory(cat.id, name); invalidate(); }}
                        onCardinality={async (cat) => {
                          try {
                            await updateCategoryCardinality(cat.id, cat.cardinality === 'single' ? 'multi' : 'single');
                            invalidate();
                          } catch {
                            toast({ title: 'Could not change the selection type', description: 'Please try again.', variant: 'destructive' });
                          }
                        }}
                        onDelete={setPendingDelete} onChanged={invalidate} />
                    ))}
                  </div>
          )}
          <AddCategoryForm onAdd={async (data) => { await createCategory({ ...data, kind: 'attribute', is_locked: false, order_index: categories.length }); invalidate(); }} />
          <ReconcileOrphansButton />
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Configuration</Button>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!pendingDelete}
        title="Delete Category"
        requireKeyword="DELETE"
        message={`Delete "${pendingDelete?.name}" and all of its options? Assignments on committee members will be removed.`}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          try {
            await deleteCategory(pendingDelete);
            setPendingDelete(null);
            invalidate();
          } catch {
            toast({ title: 'Could not delete the category', description: 'Please try again.', variant: 'destructive' });
          }
        }}
      />
    </SlidePane>
  );
}