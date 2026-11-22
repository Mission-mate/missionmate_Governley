import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import useMeetingProfileData from '@/hooks/useMeetingProfileData';
import { cn } from '@/lib/utils';
import TopBarBack from '@/components/shared/TopBarBack';
import { isUpcoming } from '@/lib/boardMeetings';
import { invalidateParticipants } from '@/lib/meetingParticipants';
import MeetingDocumentsSection from '@/components/board/meeting/MeetingDocumentsSection';
import MeetingActionsCard from '@/components/board/meeting/MeetingActionsCard';
import MeetingParticipantsCard from '@/components/board/meeting/MeetingParticipantsCard';
import MeetingDetailsCard from '@/components/board/meeting/MeetingDetailsCard';
import VideoConferencingCard from '@/components/board/meeting/VideoConferencingCard';
import CreateMeetingModal from '@/components/board/CreateMeetingModal';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';

export default function MeetingProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const { meeting, currentUser, syncing, ready, failure } = useMeetingProfileData(id);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['meeting', id] });
    qc.invalidateQueries({ queryKey: ['meetings'] });
    invalidateParticipants(qc);
  };

  if (!ready) {
    return <ModuleLoader fullPage />;
  }
  if (failure.isLoadingError) {
    return <LoadError page failure={failure} title="Couldn’t load this meeting" />;
  }
  if (!meeting) {
    return <div className="p-8 text-center text-muted-foreground">Meeting not found.</div>;
  }

  const upcoming = isUpcoming(meeting);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <TopBarBack onClick={() => navigate('/board/meetings')}>Back to Meetings</TopBarBack>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{meeting.title}</h1>
        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold',
          upcoming ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
          {upcoming ? 'Upcoming' : 'Past'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <ErrorBoundary resetKey={meeting.id}><MeetingDocumentsSection meeting={meeting} currentUser={currentUser} /></ErrorBoundary>
          <ErrorBoundary resetKey={meeting.id}><MeetingActionsCard meeting={meeting} /></ErrorBoundary>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <ErrorBoundary resetKey={meeting.id}><MeetingDetailsCard meeting={meeting} onEdit={() => setEditOpen(true)} /></ErrorBoundary>
          <ErrorBoundary resetKey={meeting.id}><VideoConferencingCard meeting={meeting} onSaved={refresh} /></ErrorBoundary>
          <ErrorBoundary resetKey={meeting.id}><MeetingParticipantsCard meeting={meeting} syncing={syncing} /></ErrorBoundary>
        </div>
      </div>

      <CreateMeetingModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={refresh}
        initialData={meeting}
        currentUser={currentUser}
        asPane
      />
    </div>
  );
}