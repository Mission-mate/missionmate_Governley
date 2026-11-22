import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReportingYearTabs from '@/components/compliance/ReportingYearTabs';
import CompliancePeriodSelector from '@/components/compliance/CompliancePeriodSelector';

/** Shared work plan register detail fields (used by Create, Clone and Import). */
export default function WorkPlanDetailsForm({ values, onChange, onPeriodTypeChange }) {
  const { title, description, periodType, startYear, status } = values;

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">
          Work plan title <span className="text-destructive">*</span>
        </Label>
        <Input
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. 2026-2027 Annual Board Work Plan"
          autoFocus
        />
      </div>

      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">Description (optional)</Label>
        <textarea
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="e.g. Annual governance work plan for the board and its committees"
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
        />
      </div>

      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">Reporting year</Label>
        <ReportingYearTabs value={periodType} onChange={onPeriodTypeChange} />
      </div>

      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">Work plan period</Label>
        <CompliancePeriodSelector value={startYear} periodType={periodType} onChange={(y) => onChange({ startYear: y })} />
      </div>

      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">Status</Label>
        <Select value={status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}