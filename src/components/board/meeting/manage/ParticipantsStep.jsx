import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import ParticipantRow from '../ParticipantRow';
import { addParticipant, removeParticipant } from '@/lib/meetingParticipants';
import { LoaderOne } from '@/components/ui/loaders';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export default function ParticipantsStep({ meeting, participants, isOpen, refresh }) {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  const { data: people = [], isLoading: peopleLoading } = useQuery({
    queryKey: ['boardPeople'],
    queryFn: () => base44.entities.BoardPerson.list('-created_date'),
    enabled: isOpen
  });

  const presentIds = useMemo(() => new Set(participants.map((p) => p.board_person_id)), [participants]);
  const available = useMemo(() => {
    const q = search.toLowerCase();
    return people.filter((p) => !presentIds.has(p.id) && (
    !q || p.member_name?.toLowerCase().includes(q) || p.member_email?.toLowerCase().includes(q)));
  }, [people, presentIds, search]);

  const handleAdd = async (person) => {
    setBusy(true);
    await addParticipant(meeting, person);
    await refresh();
    setBusy(false);
  };
  const confirmRemove = async () => {
    await removeParticipant(pendingRemove.id);
    await refresh();
    setPendingRemove(null);
  };
  return (
    <div className="space-y-5">
      {/* Current participants */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">Attendees ({participants.length})</p>
        <p className="text-xs text-muted-foreground mb-2">Committee Members are automatically added to the meeting as attendees</p>
        <div className="space-y-2">
          {participants.map((p) =>
          <ParticipantRow key={p.id} participant={p} onRemove={setPendingRemove} />
          )}
        </div>
      </div>

      {/* Add from People registry */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">Add Attendees</p>
        <p className="text-xs text-muted-foreground mb-2">Add meeting attendees from Committee Members Register</p>
        <div className="flex items-center gap-2 border border-input rounded-md px-3 h-9 mb-2 focus-within:ring-1 focus-within:ring-ring">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people..." className="flex-1 text-sm bg-transparent outline-none" />
        </div>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {peopleLoading ?
          <div className="py-6 flex justify-center"><LoaderOne size="sm" /></div> :
          available.length === 0 ?
          <p className="text-sm text-muted-foreground text-center py-4">No people available.</p> :
          available.map((p) =>
          <button
            key={p.id}
            disabled={busy}
            onClick={() => handleAdd(p)}
            title="Add attendee"
            className="group flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors text-left disabled:opacity-50">
            
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                {initials(p.member_name) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.member_name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.position || p.member_email}</p>
              </div>
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none">
                <Plus className="w-4 h-4" />
              </span>
            </button>
          )}
        </div>
      </div>

      <ConfirmTypeDialog
        isOpen={!!pendingRemove}
        title="Remove attendee"
        message={`Remove ${pendingRemove?.member_name || 'this attendee'} from this meeting? Their attendance record for this meeting will also be removed.`}
        keyword="CONFIRM"
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onClose={() => setPendingRemove(null)} />
    </div>);

}