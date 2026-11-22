import React, { useState } from 'react';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import PersonDetails from './PersonDetails';
import SharedFilesSection, { sharedFilesCount } from './SharedFilesSection';

/** Direct-conversation part of the details panel: the other person's Details and Shared files, each in its own tab. */
export default function DirectDetails({ person, shared, canDelete, onFileDeleted }) {
  const [tab, setTab] = useState('details');
  const tabs = [
    { value: 'details', label: 'Details' },
    { value: 'files', label: 'Shared files', count: sharedFilesCount(shared) },
  ];

  return (
    <>
      <div className="px-5 pt-4">
        <CapsuleTabs animated tabs={tabs} value={tab} onChange={setTab} size="sm" raised className="w-full" tabClassName="flex-1 justify-center" />
      </div>
      {tab === 'details' ? <PersonDetails person={person} /> : <SharedFilesSection shared={shared} canDelete={canDelete} onFileDeleted={onFileDeleted} />}
    </>
  );
}