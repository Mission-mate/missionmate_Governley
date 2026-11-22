import React, { useState, useMemo, useEffect } from 'react';
import { useLocalToday } from '@/components/LocalDayProvider';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isUpcoming, meetingGroupLabel, meetingMatchesFilters, MEETING_GROUP_OPTIONS } from '@/lib/boardMeetings';
import { localNow } from '@/lib/localClock';
import GroupByDropdown from '@/components/board/GroupByDropdown';
import BoardFilterPanel from '@/components/board/BoardFilterPanel';
import MeetingRow from '@/components/board/MeetingRow';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import Pagination from '@/components/shared/Pagination';

// Pagination appears only once the list exceeds the smallest page size.
const PAGE_SIZE_OPTIONS = [10, 25, 50];
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import CreateMeetingModal from '@/components/board/CreateMeetingModal';
import DeleteMeetingDialog from '@/components/board/DeleteMeetingDialog';
import { toast } from '@/components/ui/use-toast';

const TABS = [
  { id: 'upcoming', label: 'Upcoming Meetings' },
  { id: 'past', label: 'Past Meetings' },
];

export default function BoardMeetings() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [groupBy, setGroupBy] = useState('none');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ committee: [], financial_year: [], calendar_year: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBlocked, setDeleteBlocked] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: realMeetings = [], isLoading, ...read } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list('-meeting_date'),
  });
  const meetings = realMeetings;

  const refetch = () => qc.invalidateQueries({ queryKey: ['meetings'] });
  const handleView = (m) => navigate(`/board/meetings/${m.id}`);

  const day = useLocalToday();
  const filtered = useMemo(() => {
    const now = localNow();
    return meetings
      .filter(m => activeTab === 'upcoming' ? isUpcoming(m, now) : !isUpcoming(m, now))
      .filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()))
      .filter(m => meetingMatchesFilters(m, filters));
  }, [meetings, activeTab, search, filters, day]);

  // Reset to the first page whenever the visible set changes.
  useEffect(() => { setPage(1); }, [activeTab, search, filters, groupBy, pageSize]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  // Group meetings by the selected grouping option (current page only)
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: '__all', label: null, items: pageItems }];
    const map = {};
    pageItems.forEach(m => {
      const label = meetingGroupLabel(m, groupBy);
      (map[label] = map[label] || []).push(m);
    });
    return Object.entries(map).map(([label, items]) => ({ key: label, label, items }));
  }, [pageItems, groupBy]);

  const handleNew = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (m) => { setEditing(m); setModalOpen(true); };
  // Deletion runs server-side so participants and action-register links are
  // cascaded, and is refused outright while documents are still attached.
  const handleDelete = async () => {
    if (!deleteTarget) return false;
    const id = deleteTarget.id;
    setDeleteBlocked(null);
    try {
      await base44.functions.invoke('deleteMeeting', { meeting_id: id });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.error === 'documents_attached') {
        setDeleteBlocked({ count: data.document_count, titles: data.document_titles });
        return false;
      }
      toast({
        variant: 'destructive',
        title: 'Could not delete meeting',
        description: data?.error || err?.message || 'Something went wrong. Please try again.',
      });
      return false;
    }
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: ['meetings'] });
    qc.invalidateQueries({ queryKey: ['meetingParticipants', id] });
    qc.invalidateQueries({ queryKey: ['allMeetingParticipants'] });
    qc.invalidateQueries({ queryKey: ['meetingActionRegisterLinks', id] });
    // Actions and decisions linked to this meeting were unlinked, so registers refetch them.
    qc.invalidateQueries({ queryKey: ['meetingActions'] });
    qc.invalidateQueries({ queryKey: ['decisions'] });
    qc.invalidateQueries({ queryKey: ['actionMeetings'] });
    qc.invalidateQueries({ queryKey: ['meetingSearch'] });
    return true;
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="text-sm text-muted-foreground mt-1">All your past, present and future meetings in one place</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4" /> Create New Meeting
        </Button>
      </div>

      {/* Capsule tabs + controls */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <CapsuleTabs
          animated
          value={activeTab}
          onChange={setActiveTab}
          tabs={TABS.map(t => ({ value: t.id, label: t.label }))}
        />
        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-64" />
          </div>
          <GroupByDropdown options={MEETING_GROUP_OPTIONS} value={groupBy} onChange={setGroupBy} />
          <BoardFilterPanel meetings={meetings} filters={filters} setFilters={setFilters} disabled={isLoading} />
        </div>
      </div>

      {/* Column header — mirrors MeetingRow's date tile + details layout */}
      <div className="flex items-center px-5 pb-3 text-xs font-medium text-muted-foreground border-b border-border">
        <span className="w-14 shrink-0">Date</span>
        <span className="ml-5">Details</span>
      </div>

      {/* List */}
      <div className="mt-4 space-y-6">
        {isLoading ? (
          <ModuleLoader />
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load meetings" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {activeTab === 'upcoming' ? 'upcoming' : 'past'} meetings.</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.key} className="content-enter space-y-3">
              {group.label && (
                <h3 className="text-sm font-semibold text-foreground px-1">{group.label}</h3>
              )}
              {group.items.map(m => (
                <ErrorBoundary key={m.id} resetKey={m.id}>
                  <MeetingRow
                    meeting={m}
                    onOpen={handleView}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                </ErrorBoundary>
              ))}
            </div>
          ))
        )}
      </div>

      {!isLoading && total > PAGE_SIZE_OPTIONS[0] &&
        <Pagination
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      }

      <CreateMeetingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
        initialData={editing}
        currentUser={currentUser}
      />
      <DeleteMeetingDialog
        isOpen={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteBlocked(null); }}
        onConfirm={handleDelete}
        meetingTitle={deleteTarget?.title}
        blocked={deleteBlocked}
      />
    </div>
  );
}