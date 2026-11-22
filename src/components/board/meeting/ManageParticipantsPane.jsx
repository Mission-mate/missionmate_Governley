import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import StepHeader from './manage/StepHeader';
import ParticipantsStep from './manage/ParticipantsStep';
import AttendanceStep from './manage/AttendanceStep';
import CloseButton from '@/components/shared/CloseButton';
import { invalidateParticipants } from '@/lib/meetingParticipants';
const STEP_TITLES = {
  1: { title: 'Manage Attendees', subtitle: 'Add or remove people for this meeting' },
  2: { title: 'Manage Attendance', subtitle: 'Set the attendance status for each attendee' },
};

export default function ManageParticipantsPane({ meeting, participants, isOpen, onClose }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [maxVisited, setMaxVisited] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMaxVisited(1);
    }
  }, [isOpen]);

  const refresh = () => invalidateParticipants(qc);

  const goToStep = (s) => {
    setStep(s);
    setMaxVisited(prev => Math.max(prev, s));
  };

  const { title, subtitle } = STEP_TITLES[step];

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="h-full bg-white dark:bg-card flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <StepHeader currentStep={step} maxVisited={maxVisited} onStepClick={goToStep} />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <ParticipantsStep meeting={meeting} participants={participants} isOpen={isOpen} refresh={refresh} />
          )}
          {step === 2 && <AttendanceStep participants={participants} refresh={refresh} />}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => goToStep(step - 1)} disabled={step === 1}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {step < 2 ? (
            <Button onClick={() => goToStep(step + 1)}>
              Save &amp; Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={onClose}>Save Changes</Button>
          )}
        </div>
      </div>
    </SlidePane>
  );
}