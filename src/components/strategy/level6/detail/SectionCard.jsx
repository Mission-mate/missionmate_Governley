import React from 'react';
import { cn } from '@/lib/utils';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionEditButton from '@/components/shared/SectionEditButton';

/** White section card with a title and optional Edit button — matches the Contacts profile layout. */
export default function SectionCard({ title, subtitle, onEdit, showEdit = true, className, children }) {
  return (
    <div className={cn(ELEVATED_SECTION, className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          {title && <h3 className="text-base font-bold text-foreground">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {onEdit && showEdit && (
          <SectionEditButton onClick={onEdit} className="shrink-0" />
        )}
      </div>
      {children}
    </div>
  );
}