import React, { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { retryTitleSync, refreshAfterTitleSync } from '@/lib/programs/programSave';
import { cn } from '@/lib/utils';

const PILL = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium';

/**
 * Unobtrusive state of copying the program title onto its linked projects.
 * Separate from the save itself: the program is already saved when this shows.
 */
export default function TitleSyncStatus({ program }) {
  const status = program.title_sync_status;
  const sawPending = useRef(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (status === 'pending') sawPending.current = true;
    else if (sawPending.current) refreshAfterTitleSync(program.id);
  }, [status, program.id]);

  const retry = async () => {
    setRetrying(true);
    await retryTitleSync(program.id).catch(() => null);
    setRetrying(false);
  };

  if (status === 'pending') {
    return (
      <span className={cn(PILL, 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300')}>
        <Loader2 className="w-3 h-3 animate-spin" /> Updating linked projects
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-2">
        <span className={cn(PILL, 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300')} title={program.title_sync_error || undefined}>
          <AlertCircle className="w-3 h-3" /> Linked projects not updated
        </span>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={retry} disabled={retrying}>
          <RotateCw className={cn('w-3 h-3', retrying && 'animate-spin')} /> Retry
        </Button>
      </span>
    );
  }
  if (status === 'synced' && sawPending.current) {
    return (
      <span className={cn(PILL, 'content-enter bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300')}>
        <CheckCircle2 className="w-3 h-3" /> Linked projects updated
      </span>
    );
  }
  return null;
}