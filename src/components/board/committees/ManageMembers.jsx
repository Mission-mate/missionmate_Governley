import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Search, Trash2, UserPlus } from 'lucide-react';
import { addCommitteeMember, removeCommitteeMember } from '@/lib/committeesApi';
import { LoaderOne } from '@/components/ui/loaders';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';

function PersonPicker({ people, onPick, loading }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState(null);

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setCoords({ left: r.left, top: r.bottom + 4, width: r.width });
    }
  }, [open]);

  const filtered = people.filter((p) =>
  (p.member_name || '').toLowerCase().includes(query.toLowerCase()) ||
  (p.member_email || '').toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between border border-input rounded-md px-3 h-9 text-sm bg-transparent">

        <span className="flex items-center gap-2 text-muted-foreground">
          <UserPlus className="w-4 h-4" /> Add from Committee Members Register
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && coords && createPortal(
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setOpen(false)} />
          <div
            className="animate-dropdown-enter fixed bg-popover border border-input rounded-md shadow-lg z-[111] py-1"
            style={{ left: coords.left, top: coords.top, width: coords.width }}>
            <div className="p-1.5 border-b border-border">
              <div className="flex items-center gap-2 rounded-md border border-input px-2.5 h-8 focus-within:ring-1 focus-within:ring-ring">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                  placeholder="Search by name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)} />

              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {loading && <div className="py-4 flex justify-center"><LoaderOne size="sm" /></div>}
              {!loading && filtered.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No people available.</p>}
              {!loading && filtered.map((p) =>
              <button
                key={p.id}
                type="button"
                onClick={() => {onPick(p);setOpen(false);setQuery('');}}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-primary/10">

                  <span className="block font-medium truncate">{p.member_name}</span>
                  <span className="block text-xs text-muted-foreground truncate">{p.member_email}</span>
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>);

}

export default function ManageMembers({ committeeId, staged, onStagedChange, readOnly = false }) {
  const qc = useQueryClient();
  // When no committeeId is provided (new committee not yet created), operate in
  // "staged" mode — members are held in the parent's state and persisted on save.
  const isStaged = !committeeId;

  const { data: people = [], isLoading: peopleLoading } = useQuery({
    queryKey: ['boardPeople'],
    queryFn: () => base44.entities.BoardPerson.list()
  });
  const { data: persistedMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['committeeMembers', 'committee', committeeId],
    queryFn: () => base44.entities.CommitteeMember.filter({ committee_id: committeeId }),
    enabled: !!committeeId
  });
  const members = isStaged ? staged || [] : persistedMembers;

  const [adding, setAdding] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  const refetch = () => {
    qc.invalidateQueries({ queryKey: ['committeeMembers'] });
  };

  // Identify members by user_id (board_person_id may be missing on older records).
  const memberUserIds = new Set(members.map((m) => m.user_id));

  // Defensively de-duplicate the displayed list (one row per person).
  const uniqueMembers = useMemo(() => {
    const seen = new Set();
    return members.filter((m) => {
      const key = m.board_person_id || m.user_id || m.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [members]);

  const available = people.filter((p) => !memberUserIds.has(p.user_id));

  const handleAdd = async (person) => {
    if (adding || memberUserIds.has(person.user_id)) return;
    if (isStaged) {
      onStagedChange?.([...(staged || []), {
        id: `staged-${person.user_id}`,
        board_person_id: person.id,
        user_id: person.user_id,
        member_name: person.member_name,
        member_email: person.member_email
      }]);
      return;
    }
    setAdding(true);
    try {
      await addCommitteeMember(committeeId, person);
      refetch();
    } finally {
      setAdding(false);
    }
  };
  const confirmRemove = async () => {
    const memberId = pendingRemove.id;
    if (isStaged) {
      onStagedChange?.((staged || []).filter((m) => m.id !== memberId));
    } else {
      await removeCommitteeMember(memberId);
      refetch();
    }
    setPendingRemove(null);
  };

  return (
    <div className="space-y-3">
      {!readOnly && <PersonPicker people={available} onPick={handleAdd} loading={peopleLoading} />}
      <div className="space-y-2">
        {!isStaged && membersLoading ?
        <div className="py-6 flex justify-center"><LoaderOne size="sm" /></div> :
        uniqueMembers.length === 0 ?
        <p className="py-2 text-muted-foreground text-xs">No committee members added yet. Members must be added to 'Committee Members Register' before they can be assigned to a meeting committee.</p> :

        uniqueMembers.map((m) =>
        <div key={m.id} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.member_name}</p>
                <p className="text-xs text-muted-foreground truncate">{m.member_email}</p>
              </div>
              {!readOnly &&
          <button
            onClick={() => setPendingRemove(m)}
            className="text-muted-foreground hover:text-destructive shrink-0">

                <Trash2 className="w-4 h-4" />
              </button>
          }
            </div>
        )
        }
      </div>

      <ConfirmTypeDialog
        isOpen={!!pendingRemove}
        title="Remove committee member"
        message={`Remove ${pendingRemove?.member_name || 'this member'} from this committee?`}
        keyword="REMOVE"
        onConfirm={confirmRemove}
        onClose={() => setPendingRemove(null)} />
    </div>);

}