import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BOARD_OBJECT_TYPE, GOVERNANCE_OBJECT_ID, GOVERNANCE_DOC_TYPE } from '@/lib/boardDocuments';
import DocumentsTab from '@/components/documents/DocumentsTab';

// Saved on every governance document so it stays apart from meeting documents.
const GOVERNANCE_FIELDS = { board_category: 'governance', doc_type: GOVERNANCE_DOC_TYPE.key };

const HEADING = (
  <div>
    <h1 className="text-2xl font-bold text-foreground">Governance Documents</h1>
    <p className="text-sm text-muted-foreground mt-1">Keep your board’s key governance documents in one place</p>
  </div>
);

export default function BoardDocuments() {
  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <DocumentsTab
        objectType={BOARD_OBJECT_TYPE}
        objectId={GOVERNANCE_OBJECT_ID}
        currentUser={currentUser}
        heading={HEADING}
        documentDefaults={GOVERNANCE_FIELDS} />
    </div>
  );
}