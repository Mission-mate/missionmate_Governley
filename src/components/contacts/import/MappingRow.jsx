import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const NONE = '__none__';

/**
 * A single CSV-column → application-field mapping row.
 * Left: the CSV column (source). Right: a dropdown of application fields (target).
 */
export default function MappingRow({ header, targetFields, value, onChange, usedKeys }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-40 shrink-0">
        <span className="text-sm font-medium text-foreground truncate block">{header}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1">
        <Select
          value={value || NONE}
          onValueChange={(v) => onChange(v === NONE ? '' : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Don't import this column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Don't import this column</SelectItem>
            {targetFields.map((f) => {
              // Disable a field if already mapped to another column.
              const takenByOther = usedKeys[f.key] && usedKeys[f.key] !== header;
              return (
                <SelectItem key={f.key} value={f.key} disabled={takenByOther}>
                  {f.label}
                  {f.required && <span className="text-red-500 ml-1">*</span>}
                  {f.custom && <span className="text-muted-foreground ml-1.5 text-xs">(custom)</span>}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}