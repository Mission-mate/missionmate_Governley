import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import DateField from '@/components/ui/DateField';
import SectionCard from '@/components/shared/SectionCard';
import FieldError from '@/components/shared/FieldError';
import { VERSION_STATUS_OPTIONS } from '@/lib/policyVersions';
import PolicyFileDrop from '../PolicyFileDrop';

const Field = ({ label, required, children }) => (
  <div>
    <label className="mb-1 block text-xs text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</label>
    {children}
  </div>
);

/** Editable fields of a policy version: details, approval and the document file. `currentFileName` is set when editing. */
export default function VersionFormFields({ form, set, currentFileName, file, onFileChange, errors, onFileError, error }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Version Details"><div className="space-y-3">
        <Field label="Version Number" required><Input value={form.version_number} onChange={(e) => set('version_number', e.target.value)} placeholder="e.g. 2.0" className="bg-white" /><FieldError msg={errors.version_number} /></Field>
        <Field label="Summary of Changes"><Textarea rows={4} value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="e.g. Updated reporting obligations and approval thresholds" className="bg-white" /></Field>
        <Field label="Document Status">
          <Select value={form.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>{VERSION_STATUS_OPTIONS.map((o) => <SelectItem key={o.name} value={o.name}><AssetBadge value={o.name} options={VERSION_STATUS_OPTIONS} /></SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div></SectionCard>
      <SectionCard title="Approval Details"><div className="grid grid-cols-2 gap-3">
        <Field label="Approved By"><Input value={form.approved_by} onChange={(e) => set('approved_by', e.target.value)} placeholder="e.g., Board of Directors" className="bg-white" /></Field>
        <Field label="Approval Date"><DateField value={form.approved_date} onChange={(v) => set('approved_date', v)} inputClassName="bg-white" /></Field>
        <Field label="Minute Reference"><Input value={form.minute_reference} onChange={(e) => set('minute_reference', e.target.value)} placeholder="e.g. BM-2026-04, Item 5.2" className="bg-white" /></Field>
        <Field label="Effective From"><DateField value={form.effective_from} onChange={(v) => set('effective_from', v)} inputClassName="bg-white" /></Field>
      </div></SectionCard>
      {currentFileName && !file && <p className="text-xs text-muted-foreground">Current file: {currentFileName}. Choose a file to replace it.</p>}
      <PolicyFileDrop file={file} onChange={onFileChange} error={errors.file} onError={onFileError} showTitle={!!currentFileName}
        title={form.display_title} onTitleChange={(v) => set('display_title', v)} titleError={errors.display_title} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}