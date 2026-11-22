import React from 'react';
import { Label } from '@/components/ui/label';
import MemberSearchField from './MemberSearchField';
import SectionCard from '@/components/shared/SectionCard';
import { useConflictScope } from '@/lib/conflictScope';

/**
 * Board Conflict of Interest person block: committee member lookup or free-text name.
 * (Compliance declarations are always logged from a declarant's profile.)
 */
export default function PersonDetailsFields({ member, people, onSelect, readOnly = false }) {
  const { personLabel } = useConflictScope();
  return (
    <SectionCard title={`${personLabel} Details`}>
      <Label className="mb-1 block text-xs font-medium text-muted-foreground">
        {personLabel} Name {!readOnly && <span className="text-destructive">*</span>}
      </Label>
      <MemberSearchField people={people} value={member} onSelect={onSelect} disabled={readOnly} />
    </SectionCard>
  );
}