import { toast } from '@/components/ui/use-toast';

const guard = (run, title, description, onFail) => async (...args) => {
  try {
    return await run(...args);
  } catch (err) {
    console.error(err);
    onFail?.();
    toast({ title, description, variant: 'destructive' });
  }
};

/**
 * Wraps an async save handler so a failed save never freezes the form.
 * On failure it clears the saving flag and shows an error toast; the form's
 * values are left untouched so the user can simply try again.
 * A successful save runs exactly as the handler wrote it.
 */
export const guardSave = (setSaving, run, title = 'Could not save') =>
  guard(run, title, 'Your changes are still here. Check your connection and try again.', () => setSaving(false));

/**
 * Wraps a one-click record action (status change, delete, unlink) so a failure
 * shows an error toast instead of passing silently. The selection and any open
 * confirmation stay as they were, ready for another try.
 */
export const guardAction = (run, title = 'Could not complete this action') =>
  guard(run, title, 'Check your connection and try again.');