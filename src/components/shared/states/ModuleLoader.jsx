import React from 'react';
import { LoaderOne } from '@/components/ui/loaders';
import { cn } from '@/lib/utils';

/**
 * ModuleLoader — the app-wide loading state for module pages and sections.
 * Centres the LoaderOne animation with an optional label.
 *
 * Props:
 * - label: optional text under the animation
 * - size: LoaderOne size ('sm' | 'md' | 'lg'), default 'md'
 * - fullPage: fill the page height instead of a fixed block
 * - className: extra classes on the wrapper
 */
export default function ModuleLoader({ label, size = 'md', fullPage = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullPage ? 'min-h-[60vh]' : 'py-16',
        className
      )}
    >
      <LoaderOne size={size} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}