import React from 'react';
import SpringCircleButton from '@/components/shared/selection/SpringCircleButton';

/** Circular single-select control at the start of each deliverable row. */
export default function SelectCircle({ checked, onChange }) {
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