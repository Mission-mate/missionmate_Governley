import React from 'react';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';

/** Typed CONFIRM step before a module is enabled or disabled. `target` is { module, enable } or null. */
export default function ModuleToggleDialog({ target, onConfirm, onClose }) {
  const label = target?.module.label;
  const enable = target?.enable;
  return (
    <ConfirmTypeDialog
      isOpen={Boolean(target)}
      keyword="CONFIRM"
      title={enable ? `Enable ${label}?` : `Disable ${label}?`}
      message={enable
        ? `${label} will appear in the navigation and on the home page for everyone in your workspace.`
        : `${label} will be hidden from the navigation and home page for everyone in your workspace. Its data is kept and returns when the module is enabled again.`}
      confirmLabel={enable ? 'Enable module' : 'Disable module'}
      confirmVariant={enable ? 'default' : 'destructive'}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}