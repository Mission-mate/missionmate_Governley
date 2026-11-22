import React, { useState } from 'react';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { setPersonStatus, statusOf, ARCHIVED } from '@/lib/workforceRegister';

/**
 * Person Active/Archived changes with the credential cascade.
 * request(person, status) resolves true once applied, false if the user cancels the archive confirmation.
 */
export default function usePersonStatusChange(credentials, onDone) {
  const [pending, setPending] = useState(null); // { person, count, resolve }

  const apply = async (personId, status) => { await setPersonStatus(personId, status); await onDone(); };
  const request = async (person, status) => {
    if (statusOf(person) === status) return true;
    const count = credentials.filter((c) => c.person_id === person.id && statusOf(c) === 'Active').length;
    if (status === ARCHIVED && count) return new Promise((resolve) => setPending({ person, count, resolve }));
    await apply(person.id, status);
    return true;
  };
  const close = (ok) => { pending?.resolve(ok); setPending(null); };

  const dialog = (
    <ConfirmDeleteDialog isOpen={!!pending} title="Archive Person" confirmLabel="Archive"
      message={pending ? `Archiving Person Profile will also archive their ${pending.count} credential${pending.count === 1 ? '' : 's'}. Restoring the person restores them.` : ''}
      onConfirm={async () => { await apply(pending.person.id, ARCHIVED); close(true); }}
      onClose={() => close(false)} />
  );
  return { request, dialog };
}