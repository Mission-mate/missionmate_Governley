import React from 'react';
import ProgramDetailsCard from './ProgramDetailsCard';
import useCardEditLock from '@/hooks/useCardEditLock';

export default function ProgramOverviewTab({ program, onUpdate }) {
  const lock = useCardEditLock();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <ProgramDetailsCard section="details" program={program} onUpdate={onUpdate} {...lock('details')} />
      <ProgramDetailsCard section="governance" program={program} onUpdate={onUpdate} {...lock('governance')} />
    </div>
  );
}