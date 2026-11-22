import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import NotesTab from '@/components/notes/NotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';

/** Tabs appended to WHS record detail pages (Hazard, Incident, Safety Check). */
export const NOTES_DOCS_TABS = [
  { value: 'notes', label: 'Notes' },
  { value: 'documents', label: 'Documents' },
];

/** Renders the Notes or Documents tab for one WHS record, scoped by object type. */
export default function WhsNotesDocsTab({ tab, objectType, objectId }) {
  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  if (tab !== 'notes' && tab !== 'documents') return null;
  return (
    <ErrorBoundary resetKey={`${objectId}:${tab}`}>
      {tab === 'notes' && <NotesTab objectType={objectType} objectId={objectId} currentUser={currentUser} />}
      {tab === 'documents' && <DocumentsTab objectType={objectType} objectId={objectId} currentUser={currentUser} />}
    </ErrorBoundary>
  );
}