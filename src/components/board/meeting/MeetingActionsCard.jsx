import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LinkActionRegisterModal from '@/components/board/meeting/LinkActionRegisterModal';
import ActionRegisterIcon from '@/components/board/meeting-actions/ActionRegisterIcon';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import { meetingActionLinksQuery } from '@/lib/meetingProfileQueries';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { toast } from '@/components/ui/use-toast';
import CollapsibleSectionHeader from './CollapsibleSectionHeader';
import { LIFT_HOVER } from '@/components/shared/liftHover';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

function RegisterRow({ link, onOpen, onUnlink }) {
  return (
    <div className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-within:-translate-y-0.5 focus-within:shadow-md dark:hover:shadow-black/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <ActionRegisterIcon size={34} className="shrink-0 rounded-lg shadow-sm" />
      <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{link.register_title}</span>
      <Button variant="outline" size="sm" onClick={onOpen} className="shrink-0 bg-card">
        <ExternalLink /> Open
      </Button>
      <button
        type="button"
        onClick={onUnlink}
        className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Unlink"
        aria-label={`Unlink ${link.register_title}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function MeetingActionsCard({ meeting }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [linkOpen, setLinkOpen] = useState(false);
  const [pendingUnlink, setPendingUnlink] = useState(null);

  const { data: actionLinks = [], isLoading } = useQuery(meetingActionLinksQuery(meeting?.id));

  const confirmUnlink = async () => {
    if (!pendingUnlink) return;
    try {
      await base44.entities.MeetingActionRegisterLink.delete(pendingUnlink.id);
      await qc.invalidateQueries({ queryKey: ['meetingActionRegisterLinks', meeting.id] });
      setPendingUnlink(null);
    } catch (err) {
      console.error('Failed to unlink action register', err);
      toast({
        variant: 'destructive',
        title: 'Could not unlink action',
        description: 'Please try again.',
      });
    }
  };

  return (
    <div className={`${ELEVATED_CARD} p-6`}>
      <CollapsibleSectionHeader
        icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
        title="Meeting Actions"
        count={isLoading ? undefined : actionLinks.length}
        subtitle="Track meeting actions, owners, due dates and progress."
        action={(
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            className={`flex items-center gap-1.5 text-sm font-medium text-primary ${LIFT_HOVER}`}
          >
            <Link2 className="w-4 h-4" /> Link Registers
          </button>
        )}
      />

      {isLoading ? (
        <ModuleLoader />
      ) : actionLinks.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-10 text-center text-muted-foreground text-sm">
          No registers linked to this meeting yet.
        </div>
      ) : (
        <div className="space-y-2">
          {actionLinks.map((link) => (
            <RegisterRow
              key={link.id}
              link={link}
              onOpen={() => navigate(`/board/meeting-actions/${link.register_id}`)}
              onUnlink={() => setPendingUnlink(link)}
            />
          ))}
        </div>
      )}

      <LinkActionRegisterModal
        isOpen={linkOpen}
        onClose={() => setLinkOpen(false)}
        meetingId={meeting?.id}
        linkedIds={actionLinks.map((l) => l.register_id)}
      />

      <ConfirmTypeDialog
        isOpen={!!pendingUnlink}
        title="Unlink Register"
        message={`This will remove "${pendingUnlink?.register_title}" from this meeting. The register itself and its actions are not deleted.`}
        keyword="CONFIRM"
        confirmLabel="Unlink"
        onConfirm={confirmUnlink}
        onClose={() => setPendingUnlink(null)}
      />
    </div>
  );
}