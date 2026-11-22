import React, { useState } from 'react';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';

/**
 * Confirmation for removing a saved customiser item. Options get a plain confirm
 * and leave the field's draft (saved with the field); custom columns require typing
 * DELETE and are deleted immediately.
 * Usage: const { confirm, dialog } = useRemovalConfirm(); confirm('option' | 'column', name, run)
 */
export default function useRemovalConfirm() {
  const [pending, setPending] = useState(null);
  const isColumn = pending?.kind === 'column';

  const confirm = (kind, name, run) => setPending({ kind, name, run });

  const dialog = (
    <ConfirmDeleteDialog
      isOpen={!!pending}
      overlayClassName="z-[120]"
      onClose={() => setPending(null)}
      title={isColumn ? 'Delete Custom Column' : 'Remove Option'}
      confirmLabel={isColumn ? 'Delete' : 'Remove'}
      requireKeyword={isColumn ? 'DELETE' : ''}
      message={isColumn
        ? `Delete the "${pending?.name}" column? Values entered in it will be removed. This is saved immediately and cannot be undone.`
        : `Remove the "${pending?.name}" option? It is removed when you save this field.`}
      onConfirm={async () => { await pending.run(); setPending(null); }}
    />
  );

  return { confirm, dialog, isOpen: !!pending };
}