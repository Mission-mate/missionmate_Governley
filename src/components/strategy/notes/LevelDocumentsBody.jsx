import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import EditFooterActions from '@/components/shared/EditFooterActions';
import DocumentsTab from '@/components/documents/DocumentsTab';
import { STRATEGY_BLOCK_NOTES } from './levelNotes';

/** Documents tab body for strategy level drawers — scoped to the StrategyBlock id; footer is Close in view mode, Cancel + disabled Save Changes in edit mode. */
export default function LevelDocumentsBody({ item, readOnly, onClose, onCancelEdit }) {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <DocumentsTab objectType={STRATEGY_BLOCK_NOTES} objectId={item.id} currentUser={currentUser} hideTitle readOnly={readOnly} compact />
      </div>
      <div className="flex justify-end gap-3 px-5 py-3 border-t border-border shrink-0">
        {readOnly
          ? <Button variant="outline" onClick={onClose}>Close</Button>
          : <EditFooterActions dirty={false} onCancel={onCancelEdit} />}
      </div>
    </>
  );
}