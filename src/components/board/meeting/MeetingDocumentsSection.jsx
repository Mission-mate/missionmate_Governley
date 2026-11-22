import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FileText, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import AddMeetingDocumentModal from './AddMeetingDocumentModal';
import ViewBoardDocumentModal from '@/components/board/documents/ViewBoardDocumentModal';
import EditBoardDocumentPane from '@/components/board/documents/EditBoardDocumentPane';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import SelectionActionBar from '@/components/documents/SelectionActionBar';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import { meetingDocumentsQuery } from '@/lib/meetingProfileQueries';
import CollapsibleSectionHeader from './CollapsibleSectionHeader';
import MeetingDocumentRow from './MeetingDocumentRow';
import MeetingDocumentMoveList from './MeetingDocumentMoveList';
import { LIFT_HOVER } from '@/components/shared/liftHover';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import { runDelete } from '@/lib/deleteWithFeedback';
import { openDocument, downloadDocument } from '@/lib/documentStorage';

// Documents shown before the list needs expanding.
const VISIBLE_LIMIT = 5;
const EXPAND_EASE = [0.22, 1, 0.36, 1];

export default function MeetingDocumentsSection({ meeting, currentUser }) {
  const qc = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [removeDoc, setRemoveDoc] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [moving, setMoving] = useState(false);
  // Local to this mount, so the list is back to its first five whenever the page is reopened.
  const [showAll, setShowAll] = useState(false);

  const queryKey = ['meetingDocuments', meeting.id];
  const { data: docs = [], isLoading } = useQuery(meetingDocumentsQuery(meeting.id));
  const selected = docs.find(d => d.id === selectedId) || null;

  const clearSelection = () => { setSelectedId(null); setMoving(false); };

  // A different meeting, or the selected document disappearing, clears the selection.
  useEffect(() => { clearSelection(); }, [meeting.id]);
  useEffect(() => { if (selectedId && !isLoading && !selected) clearSelection(); }, [selectedId, selected, isLoading]);

  const refresh = () => qc.invalidateQueries({ queryKey });

  const toggleSelect = (doc) => {
    setMoving(false);
    setSelectedId(id => (id === doc.id ? null : doc.id));
  };

  const handleRemove = async () => {
    if (!removeDoc) return;
    const ok = await runDelete(() => base44.entities.Document.delete(removeDoc.id), {
      errorTitle: 'Could not delete document',
    });
    refresh();
    if (ok) setRemoveDoc(null);
  };

  // Saves every document's position so the new order survives reloads.
  const handleReorder = async (next) => {
    const previous = docs;
    qc.setQueryData(queryKey, next.map((d, i) => ({ ...d, order_index: i })));
    try {
      await base44.entities.Document.bulkUpdate(next.map((d, i) => ({ id: d.id, order_index: i })));
    } catch (err) {
      qc.setQueryData(queryKey, previous);
      toast({ variant: 'destructive', title: 'Could not save the new order', description: err?.message || 'Please try again.' });
    }
    refresh();
  };

  const rowProps = { onSelect: toggleSelect, onView: setViewDoc, onOpen: openDocument, onDownload: downloadDocument };
  const renderRow = (doc) => (
    <MeetingDocumentRow key={doc.id} {...rowProps} doc={doc} selected={doc.id === selectedId} />
  );
  const extraDocs = docs.slice(VISIBLE_LIMIT);

  return (
    <div className={`${ELEVATED_CARD} p-6`}>
      <CollapsibleSectionHeader
        icon={<FileText className="w-5 h-5 text-primary" />}
        title="Meeting Documents"
        count={isLoading ? undefined : docs.length}
        subtitle={moving ? 'Drag the selected document to its new position, then choose Done.' : 'Manage agendas, minutes, reports and supporting meeting documents.'}
        action={(
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Document
          </Button>
        )}
      />

      {isLoading ? (
        <ModuleLoader />
      ) : docs.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-10 text-center text-muted-foreground text-sm">
          No documents added to this meeting yet.
        </div>
      ) : moving ? (
        // Every document is listed while moving, so the selected one can go anywhere.
        <MeetingDocumentMoveList docs={docs} selectedId={selectedId} rowProps={rowProps} onReorder={handleReorder} />
      ) : (
        <div>
          <div className="space-y-3">{docs.slice(0, VISIBLE_LIMIT).map(renderRow)}</div>
          <AnimatePresence initial={false}>
            {showAll && extraDocs.length > 0 && (
              <motion.div
                key="extra-docs"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.34, ease: EXPAND_EASE }}
                className="overflow-hidden -mx-1 px-1"
              >
                <div className="space-y-3 pt-3 pb-1">{extraDocs.map(renderRow)}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {extraDocs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(v => !v)}
              aria-expanded={showAll}
              className={`mt-3 w-full flex items-center justify-center gap-1.5 pt-1 text-sm font-medium text-primary ${LIFT_HOVER}`}
            >
              {showAll ? 'Collapse' : `Show all ${docs.length} documents`}
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', showAll && 'rotate-180')} />
            </button>
          )}
        </div>
      )}

      <SelectionActionBar
        floating
        open={!!selected}
        onView={() => setViewDoc(selected)}
        onOpen={() => openDocument(selected)}
        onEdit={() => setEditDoc(selected)}
        onMove={() => setMoving(m => !m)}
        moveActive={moving}
        onDownload={() => downloadDocument(selected)}
        onDelete={() => setRemoveDoc(selected)}
        onClear={clearSelection}
      />

      <AddMeetingDocumentModal isOpen={addOpen} onClose={() => setAddOpen(false)} meeting={meeting} currentUser={currentUser} onSaved={refresh} />
      <ViewBoardDocumentModal doc={viewDoc} onClose={() => setViewDoc(null)} />
      <EditBoardDocumentPane doc={editDoc} onClose={() => setEditDoc(null)} onSaved={refresh} />
      <ConfirmTypeDialog
        isOpen={!!removeDoc}
        title="Delete Document"
        message={`Delete "${removeDoc?.title}" from this meeting? This cannot be undone.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleRemove}
        onClose={() => setRemoveDoc(null)}
      />
    </div>
  );
}