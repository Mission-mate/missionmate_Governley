import React from 'react';
import { META_ICON_CIRCLE } from '@/components/shared/metaStyles';

/** Labelled property column in the task detail view (muted-blue icon + label above the value). */
export default function TaskPropertyRow({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={META_ICON_CIRCLE}><Icon className="w-3.5 h-3.5" strokeWidth={1.9} /></span>
        {label}
      </div>
      <div className="min-w-0 min-h-[32px] flex items-center text-sm text-foreground">{children}</div>
    </div>
  );
}