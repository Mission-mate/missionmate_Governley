import React from 'react';
import SpringCircleButton from '@/components/shared/selection/SpringCircleButton';

// Circle checkbox with blue tick when selected (matches Contacts table style)
export default function CircleCheck({ checked, onChange, indeterminate = false }) {
  return (
    <SpringCircleButton
      active={checked || indeterminate}
      onClick={onChange}
      className="border-2"
      activeClassName="bg-primary border-primary"
      idleClassName="border-input bg-transparent hover:border-primary/60"
      iconClassName="text-primary-foreground"
      strokeWidth={3}
    />
  );
}