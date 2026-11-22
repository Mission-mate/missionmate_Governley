import React, { useState } from 'react';
import { Plus, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import LogRiskReviewPane from './LogRiskReviewPane';
import DeleteReviewDialog from './DeleteReviewDialog';
import SelectableCardList from '@/components/risk/detail/SelectableCardList';
import { REVIEW_COLUMNS } from '@/components/risk/detail/riskTableColumns';

export default function ReviewHistory({ reviews = [], onSave }) {
  const [paneOpen, setPaneOpen] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [startInEdit, setStartInEdit] = useState(false);
  const [deleteReview, setDeleteReview] = useState(null);

  const sorted = [...reviews].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const handleSave = async (entry) => {
    // Changes are sent per review, so other reviews are never overwritten.
    const existing = entry.id && reviews.find((r) => r.id === entry.id);
    const item = existing ?
    { ...existing, ...entry } :
    { ...entry, id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
    await onSave({ upserts: [{ item, base: existing ? editReview : null }] });
    // An edited review stays open in view mode showing the saved values.
    if (existing) { setEditReview(item); setStartInEdit(false); }
  };

  const handleDelete = async () => {
    await onSave({ removes: [deleteReview.id] });
    setDeleteReview(null);
  };

  const openCreate = () => {setEditReview(null);setStartInEdit(true);setPaneOpen(true);};
  const openReview = (r, edit) => {setEditReview(r);setStartInEdit(edit);setPaneOpen(true);};
  const closePane = () => {setPaneOpen(false);setEditReview(null);};

  return (
    <div className={cn(ELEVATED_SECTION, 'mt-6')}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Progress & Compliance Reporting</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Capture progress notes, status updates and compliance reporting</p>
        </div>
        <Button size="sm" className="gap-1.5 text-sm" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Log Review
        </Button>
      </div>

      {sorted.length === 0 ?
      <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <ClipboardCheck className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No reviews yet. Click "Log Review" to record one.</p>
        </div> :

      <SelectableCardList
        items={sorted}
        columns={REVIEW_COLUMNS}
        onView={(r) => openReview(r, false)}
        onEdit={(r) => openReview(r, true)}
        onDelete={setDeleteReview} />
      }

      <LogRiskReviewPane
        isOpen={paneOpen}
        onClose={closePane}
        onSave={handleSave}
        editReview={editReview}
        startInEdit={startInEdit} />

      <DeleteReviewDialog
        isOpen={!!deleteReview}
        name={deleteReview?.title}
        onClose={() => setDeleteReview(null)}
        onConfirm={handleDelete} />
      
    </div>);

}