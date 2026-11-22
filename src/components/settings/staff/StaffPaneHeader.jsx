import React from 'react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { ROLE_LABELS, ROLE_BADGE, memberName } from '@/lib/staffRoles';

/** Shared team member header — avatar, name, role badge. View mode adds the Edit icon and view-only hint. */
export default function StaffPaneHeader({ member, readOnly, onEdit, onClose }) {
  const name = memberName(member);
  return (
    <div className="px-6 pt-5 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <PersonInitialsAvatar name={name} className="w-11 h-11 text-sm" />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight truncate">{name}</h2>
            <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_BADGE[member.role] || ROLE_BADGE.user}`}>
              {ROLE_LABELS[member.role] || member.role}
            </span>
          </div>
        </div>
        <PaneIconHeaderActions onEdit={onEdit} onClose={onClose} showEdit={readOnly} />
      </div>
      <ViewModeHint className="mt-1.5" editing={!readOnly} />
    </div>
  );
}