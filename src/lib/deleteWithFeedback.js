import { toast } from '@/components/ui/use-toast';

/**
 * Run a delete operation and always tell the user what happened.
 *
 * Without this, a failed delete closed its confirmation dialog anyway and the
 * record silently reappeared on the next refetch. Callers should only close
 * dialogs / clear selections when this returns true.
 *
 * @returns {boolean} true when the delete succeeded
 */
export async function runDelete(action, { errorTitle = 'Delete failed', successTitle } = {}) {
  try {
    await action();
    if (successTitle) toast({ title: successTitle });
    return true;
  } catch (err) {
    toast({
      variant: 'destructive',
      title: errorTitle,
      description: err?.message || 'Something went wrong. Please try again.',
    });
    return false;
  }
}