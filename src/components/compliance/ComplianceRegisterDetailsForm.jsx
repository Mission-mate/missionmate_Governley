import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReportingYearTabs from '@/components/compliance/ReportingYearTabs';
import CompliancePeriodSelector from '@/components/compliance/CompliancePeriodSelector';

/** Step-1 details fields shared by Create New, Clone Existing and Edit. */
export default function ComplianceRegisterDetailsForm({ values, onChange, onPeriodTypeChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">
          Compliance Calendar Title <span className="text-destructive">*</span>
        </Label>
        <Input
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. 2028-2029 Compliance Register"
          autoFocus
        />
      </div>
      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">Description (Optional)</Label>
        <textarea
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="e.g. Track all compliance obligations for the financial year"
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
        />
      </div>
      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">Reporting Year</Label>
        <ReportingYearTabs value={values.periodType} onChange={onPeriodTypeChange} />
      </div>
      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">Compliance Period</Label>
        <CompliancePeriodSelector value={values.startYear} periodType={values.periodType} onChange={(y) => onChange({ startYear: y })} />
      </div>
      <div>
        <Label className="mb-1.5 block text-sm font-medium text-foreground">Status</Label>
        <Select value={values.status} onValueChange={(s) => onChange({ status: s })}>
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