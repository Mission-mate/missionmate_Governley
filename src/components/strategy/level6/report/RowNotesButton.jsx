import React from 'react';
import { FileText } from 'lucide-react';
import IconTip from '@/components/shared/IconTip';
import RailBadgeIcon from '@/components/shared/RailBadgeIcon';

/** Blue notes badge shown on reporting rows that have notes — matches the checklist "Has notes" badge. */
export default function RowNotesButton({ onClick }) {
  return (
    <IconTip label="Has notes">
      <button type="button" onClick={onClick} aria-label="Has notes" className="inline-flex shrink-0 p-1 rounded-full hover:opacity-90 transition-opacity">
        <RailBadgeIcon icon={FileText} tone="blue" className="w-5 h-5 [&>svg]:w-3 [&>svg]:h-3" />
      </button>
    </IconTip>
  );
}