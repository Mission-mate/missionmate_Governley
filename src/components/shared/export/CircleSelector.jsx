import React from 'react';
import SpringCircleButton from '@/components/shared/selection/SpringCircleButton';

/**
 * Circular selection indicator used in Export to PDF modals.
 * Purely presentational — the parent <label>/<button> handles the click.
 */
export default function CircleSelector({ checked }) {
  return (
    <SpringCircleButton
      as="span"
      active={checked}
      className="border"
      activeClassName="border-primary bg-primary text-primary-foreground"
      idleClassName="border-input bg-transparent"
      strokeWidth={3}
    />
  );
}