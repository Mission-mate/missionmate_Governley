import React from 'react';
import ProjectDetailsCard from './ProjectDetailsCard';
import useCardEditLock from '@/hooks/useCardEditLock';

/** programTitle is the linked program's current title, or the saved copy when it can't be found. */
export default function ProjectOverviewTab({ project, programTitle, onUpdate }) {
  const lock = useCardEditLock();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <ProjectDetailsCard section="details" project={project} programTitle={programTitle} onUpdate={onUpdate} {...lock('details')} />
      <ProjectDetailsCard section="governance" project={project} onUpdate={onUpdate} {...lock('governance')} />
    </div>
  );
}