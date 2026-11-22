import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AttendeeAvatarRow from './AttendeeAvatarRow';
import AttendanceBar from './AttendanceBar';
import ManageParticipantsPane from './ManageParticipantsPane';
import { meetingParticipantsQuery } from '@/lib/meetingProfileQueries';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';

const FOCUS_RING = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-primary/40 focus-visible:outline-offset-2';
const ARRIVE_EASE = [0.2, 0.75, 0.25, 1];

/** Compact right-column card. `syncing` comes from the page's participant sync — shown inline only when the committee changes after load. */
export default function MeetingParticipantsCard({ meeting, syncing }) {
  const [manageOpen, setManageOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const { data: participants = [], isLoading } = useQuery(meetingParticipantsQuery(meeting.id));
  const loading = isLoading || syncing;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: -7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: ARRIVE_EASE }}
      className={`${ELEVATED_CARD} px-[22px] pt-[22px]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-5 h-5 shrink-0 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Meeting Attendees
            {!loading && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] ml-[5px] px-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold align-[1px]">
                {participants.length}
              </span>
            )}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className={`shrink-0 rounded-lg px-[9px] py-[7px] text-[13px] leading-[1.3] font-semibold text-primary transition-[background-color,color,box-shadow] duration-[160ms] ease-in-out hover:bg-primary/10 hover:text-primary/90 active:bg-primary/20 ${FOCUS_RING}`}
        >
          Manage
        </button>
      </div>
      <p className="mt-2 mb-[18px] ml-7 text-[13px] leading-normal text-muted-foreground">
        Invite attendees and record attendance.
      </p>

      {loading ? (
        <ModuleLoader className="pb-6" />
      ) : (
        <>
          {participants.length === 0 ? (
            <div className="py-[18px] px-3 text-center border border-dashed border-border rounded-xl bg-muted/30 text-[13px] leading-[1.45] text-muted-foreground">
              No attendees yet.
            </div>
          ) : (
            <div className="space-y-4">
              <AttendeeAvatarRow attendees={participants} />
              <AttendanceBar attendees={participants} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className={`group w-[calc(100%+44px)] -mx-[22px] mt-5 flex items-center justify-center gap-2 px-4 py-3.5 border-t border-border rounded-b-2xl bg-primary/[0.03] text-[13px] leading-[1.35] font-semibold text-primary transition-colors duration-[160ms] ease-in-out hover:bg-primary/10 hover:text-primary/90 active:bg-primary/20 ${FOCUS_RING}`}
          >
            View all {participants.length} Attendees
            <ChevronRight className="w-4 h-4 transition-transform duration-[180ms] ease-in-out group-hover:translate-x-0.5" strokeWidth={1.8} />
          </button>
        </>
      )}

      <ManageParticipantsPane
        meeting={meeting}
        participants={participants}
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
      />
    </motion.section>
  );
}