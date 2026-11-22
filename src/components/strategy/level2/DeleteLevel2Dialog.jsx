import React from 'react';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';

/** Type-DELETE confirmation before removing a strategic theme. */
export default function DeleteLevel2Dialog({ isOpen, item, count, onClose, onConfirm }) {
  return (
    <ConfirmTypeDialog
      isOpen={isOpen}
      title="Delete theme?"
      message={
        <>
          This will permanently delete the theme <span className="font-semibold text-foreground">{item?.name}</span>.
          {count > 0
            ? ` It is assigned to ${count} item(s), which will be unassigned but not deleted.`
            : ''}
          {' '}This cannot be undone.
        </>
      }
      keyword="DELETE"
      confirmLabel="Delete"
      overlayClassName="z-[60]"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}