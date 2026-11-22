import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, ClipboardCheck, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import { listMeetingActionRegisters } from '@/lib/meetingActionApi';
import { cn } from '@/lib/utils';
import CloseButton from '@/components/shared/CloseButton';
const OBJECT_TYPE = 'board';
const OBJECT_ID = 'board';

export default function LinkActionRegisterModal({ isOpen, onClose, meetingId, linkedIds = [] }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data: actionRegisters = [] } = useQuery({
    queryKey: ['meetingActionRegisters', OBJECT_TYPE, OBJECT_ID],
    queryFn: () => listMeetingActionRegisters(OBJECT_TYPE, OBJECT_ID)
  });

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected([]);
    }
  }, [isOpen]);

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return actionRegisters.filter(
      (r) =>
      (r.status || 'active') === 'active' &&
      !linkedIds.includes(r.id) && (
      !q || r.title?.toLowerCase().includes(q))
    );
  }, [actionRegisters, linkedIds, search]);

  const toggle = (id) =>
  setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const handleLink = async () => {
    setSaving(true);
    await Promise.all(
      selected.map((id) => {
        const reg = actionRegisters.find((r) => r.id === id);
        return base44.entities.MeetingActionRegisterLink.create({
          register_id: id,
          meeting_id: meetingId,
          register_title: reg?.title || ''
        });
      })
    );
    qc.invalidateQueries({ queryKey: ['meetingActionRegisterLinks', meetingId] });
    setSaving(false);
    onClose();
  };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-card h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <h2 className="text-lg font-bold text-foreground">Link Meeting Action Registers</h2>
          <CloseButton onClick={onClose} />
        </div>

        <div className="px-6 pb-3 shrink-0">
          <p className="text-xs text-muted-foreground">Search for Meeting Action Registers created in Actions workspace</p>

          <div className="flex items-center gap-2 border border-input rounded-md px-3 h-9 mt-3 focus-within:ring-1 focus-within:ring-ring">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="flex-1 text-sm bg-transparent outline-none" />
            
          </div>
        </div>

        <div className="px-6 pb-2 flex-1 overflow-y-auto">
          {available.length === 0 ?
          <div className="text-center py-10 text-muted-foreground">
              <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No available registers to link.</p>
            </div> :

          <div className="space-y-2">
              {available.map((r) => {
              const isSel = selected.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggle(r.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg border text-left transition-colors',
                    isSel ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}>
                  
                    <div className={cn(
                    'w-5 h-5 rounded-md border flex items-center justify-center shrink-0',
                    isSel ? 'bg-primary border-primary' : 'border-input'
                  )}>
                      {isSel && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      {r.description &&
                    <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                    }
                    </div>
                  </button>);

            })}
            </div>
          }
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleLink} disabled={saving || selected.length === 0}>
            {saving ? 'Linking...' : `Link${selected.length ? ` (${selected.length})` : ''}`}
          </Button>
        </div>
      </div>
    </SlidePane>);

}