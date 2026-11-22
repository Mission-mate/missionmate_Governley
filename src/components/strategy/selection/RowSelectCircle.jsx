import React from 'react';
import SpringCircleButton from '@/components/shared/selection/SpringCircleButton';

/** Circle single-select selector shown at the start of every strategy row. */
export default function RowSelectCircle({ checked, onChange }) {
  return (
    <SpringCircleButton
      active={checked}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      title={checked ? 'Deselect' : 'Select'}
      className="border"
      activeClassName="bg-primary border-primary text-primary-foreground"
      idleClassName="border-border bg-card hover:border-primary/60"
    />
  );
}