import React from 'react';
import { cn } from '@/lib/utils';
import SlidePane from '@/components/ui/SlidePane';
import { LoaderOne } from '@/components/ui/loaders';

/** Loading state shown inside a strategy right-side detail pane until its data is ready. */
export default function PaneLoading({ onClose, expanded }) {
  return (
    <SlidePane
      isOpen
      onClose={onClose}
      className={cn('bg-card shadow-2xl flex items-center justify-center font-body', expanded && 'max-w-[1008px]')}
    >
      <LoaderOne size="lg" />
    </SlidePane>
  );
}