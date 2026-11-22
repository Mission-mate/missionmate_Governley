import React from 'react';
import { LoaderOne } from '@/components/ui/loaders';
import { cn } from '@/lib/utils';

/**
 * SectionLoader — small inline loader for a single config-dependent region
 * inside a pane, modal or card. Never blocks the whole surface.
 */
export default function SectionLoader({ size = 'sm', className }) {
  return (
    <div className={cn('flex items-center justify-center py-6', className)}>
      <LoaderOne size={size} />
    </div>
  );
}