import React from 'react';
import { Link } from 'react-router-dom';
import { formatReviewDate } from '@/lib/complianceRegisters';
import usePolicyInlineEdit from '@/hooks/usePolicyInlineEdit';
import PolicyBadge from './PolicyBadge';
import PolicyDetailCard from './PolicyDetailCard';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';
import { DetailsInputs, OwnershipInputs, ClassificationInputs, ReviewInputs } from './PolicyFieldGroups';
import { frequencyLabel } from './policyFormat';

const Item = ({ label, children, full }) => (
  <div className={full ? 'col-span-full' : ''}>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    <div className="text-sm text-foreground break-words">{children || '—'}</div>
  </div>
);
const date = (d) => d && formatReviewDate(d);
const TWO = 'grid grid-cols-2 gap-x-6 gap-y-3';
const THREE = 'grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3';

/** Details tab: elevated cards (inline-editable, one at a time) in two columns, linked documents full-width below. */
export default function PolicyDetailsTab({ doc, parent, docs, types, columns = [], categories, onSaved, linked }) {
  const e = usePolicyInlineEdit({ doc, docs, onSaved });
  const card = (key, title, grid, view, edit) => (
    <PolicyDetailCard title={title} editing={e.editing === key} disabled={e.blocked && e.editing !== key}
      onEdit={() => e.start(key)} onCancel={e.cancel} onSave={e.save} saving={e.saving} error={e.error}
      view={<div className={grid}>{view}</div>} edit={e.form && edit()} />
  );
  const fp = { form: e.form, set: e.set, errors: e.errors };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {card('details', 'Document Details', TWO, <>
          <Item label="Title" full>{doc.title}</Item>
          {doc.description && <Item label="Description" full><span className="whitespace-pre-wrap font-normal">{doc.description}</span></Item>}
          <Item label="Document Type">{doc.document_type}</Item>
          <Item label="Category">{doc.category}</Item>
          <Item label="Parent Document">{parent && <Link to={`/compliance/policy/${parent.id}`} className="text-primary hover:underline">{parent.title}</Link>}</Item>
          {columns.length > 0 && <div className="col-span-full"><AssetCustomFields values={doc} edit={false} columns={columns} /></div>}
        </>, () => <DetailsInputs {...fp} types={types} columns={columns} categories={categories} parents={e.parents} parent={e.parent} />)}
        {card('ownership', 'Ownership and Approval', TWO, <>
          <Item label="Document Owner">{doc.owner}</Item>
          <Item label="Approved By">{doc.approved_by}</Item>
          <Item label="Date Approved">{date(doc.approved_date)}</Item>
          <Item label="Effective Date">{date(doc.effective_date)}</Item>
        </>, () => <OwnershipInputs {...fp} />)}
        {card('classification', 'Classification and Lifecycle', THREE, <>
          <Item label="Classification"><PolicyBadge value={doc.classification} /></Item>
          <Item label="Policy Stage"><PolicyBadge value={doc.stage} /></Item>
          <Item label="Policy Status"><PolicyBadge value={doc.status} /></Item>
        </>, () => <ClassificationInputs {...fp} />)}
        {card('review', 'Review Details', THREE, <>
          <Item label="Review Frequency">{doc.review_with_parent ? "Follows parent's review" : frequencyLabel(doc)}</Item>
          <Item label="Last Review Date">{date(doc.last_review_date)}</Item>
          <Item label="Next Review Date">{date(doc.next_review_date)}</Item>
        </>, () => <ReviewInputs {...fp} parent={e.parent} review={e.review} bare />)}
      </div>
      {linked}
    </div>
  );
}