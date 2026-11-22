import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AddDescriptionToggle from '@/components/compliance/assets/AddDescriptionToggle';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateField from '@/components/ui/DateField';
import ReviewSection from '@/components/compliance/registers/ReviewSection';
import InfoTooltip from '@/components/risk/InfoTooltip';
import BadgeSelect from './BadgeSelect';
import FieldError from '@/components/shared/FieldError';
import ParentDocumentPicker from './ParentDocumentPicker';
import { CLASSIFICATIONS, STAGES, POLICY_STATUSES } from '@/lib/policies';

/** Policy field groups, shared by the add/edit pane and the inline detail cards. */
const L = 'mb-1 block text-xs text-muted-foreground';
const Req = () => <span className="text-destructive">*</span>;
const Err = FieldError;

export function DetailsInputs({ form, set, types, columns = [], categories, parents, parent, lockParent, errors = {} }) {
  return (
    <div className="space-y-3">
      <div><Label className={L}>Title <Req /></Label>
        <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Conflict of Interest Policy" className="bg-white" /><Err msg={errors.title} /></div>
      <AddDescriptionToggle value={form.description} onChange={(v) => set('description', v)} placeholder="Describe the policy..." className="" />
      <div className="grid grid-cols-2 gap-3">
        <div><Label className={L}>Document Type <Req /></Label>
          <Select value={form.document_type || ''} onValueChange={(v) => set('document_type', v)}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select><Err msg={errors.document_type} /></div>
        <div><Label className={L}>Category <Req /></Label>
          <Select value={parent ? parent.category : form.category || ''} onValueChange={(v) => set('category', v)} disabled={!!parent}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select><Err msg={errors.category} />
          {parent && <p className="text-[11px] text-muted-foreground mt-1">Inherited from parent</p>}</div>
      </div>
      <div><Label className={`${L} flex items-center gap-1`}>Parent Document <InfoTooltip text="Linked documents appear under the policy they support in the table" /></Label>
        <ParentDocumentPicker value={form.parent_id} onChange={(v) => set('parent_id', v)} parents={parents} disabled={lockParent} />
        <p className="text-[11px] text-muted-foreground mt-1">Supporting document? Select the policy it belongs to. Main policy? Leave blank</p></div>
      {columns.length > 0 && <AssetCustomFields values={form} set={set} edit columns={columns} />}
    </div>
  );
}

export function OwnershipInputs({ form, set, errors = {} }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div><Label className={`${L} flex items-center gap-1`}>Document Owner <Req /><InfoTooltip text="The position, team, or business unit accountable for managing and reviewing the policy" /></Label>
        <Input value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="e.g. Helen Ward" className="bg-white" /><Err msg={errors.owner} /></div>
      <div><Label className={L}>Approved By</Label>
        <Input value={form.approved_by} onChange={(e) => set('approved_by', e.target.value)} placeholder="e.g., Chief Executive" className="bg-white" /></div>
      <div><Label className={L}>Date Approved</Label>
        <DateField value={form.approved_date || ''} onChange={(v) => set('approved_date', v)} inputClassName="bg-white" /></div>
      <div><Label className={`${L} flex items-center gap-1`}>Effective Date <InfoTooltip text="The date the policy takes effect" /></Label>
        <DateField value={form.effective_date || ''} onChange={(v) => set('effective_date', v)} inputClassName="bg-white" /></div>
    </div>
  );
}

export function ClassificationInputs({ form, set }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div><Label className={L}>Classification</Label><BadgeSelect value={form.classification} onChange={(v) => set('classification', v)} options={CLASSIFICATIONS} /></div>
      <div><Label className={L}>Policy Stage</Label><BadgeSelect value={form.stage} onChange={(v) => set('stage', v)} options={STAGES} /></div>
      <div><Label className={L}>Policy Status</Label><BadgeSelect value={form.status} onChange={(v) => set('status', v)} options={POLICY_STATUSES} /></div>
    </div>
  );
}

/** Share-parent toggle (linked documents only) plus the review schedule. `bare` drops the muted section wrapper. */
export function ReviewInputs({ form, set, parent, review, bare, errors = {} }) {
  return (
    <div className="space-y-3">
      {parent && (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
          <span><span className="block text-sm font-medium text-foreground">Share parent's review date</span>
            <span className="block text-xs text-muted-foreground">Review schedule follows "{parent.title}"</span></span>
          <Switch checked={!!form.review_with_parent} onCheckedChange={(v) => set('review_with_parent', v)} />
        </label>
      )}
      {!(parent && form.review_with_parent) && <ReviewSection form={form} bare={bare} {...review} frequencyError={errors.review_frequency} />}
    </div>
  );
}