import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Solid-colour rounded-square icon with a white symbol, matching the sidebar module tiles.
 * Corner radius and symbol scale with `size`, so the tile can be magnified as one.
 */
export default function ModuleTile({ bg, icon: Icon, size = 32, className }) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center text-white', bg || 'bg-primary', className)}
      style={{ width: size, height: size, borderRadius: size * 0.33 }}
    >
      <Icon style={{ width: '50%', height: '50%' }} />
    </div>
  );
}