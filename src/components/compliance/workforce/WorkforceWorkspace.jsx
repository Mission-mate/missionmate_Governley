import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { listPeople, listCredentials } from '@/lib/workforceRegister';
import WorkforceSummaryCards from './WorkforceSummaryCards';
import WorkforcePeopleTab from './WorkforcePeopleTab';
import CredentialsTab from './CredentialsTab';
import AddPersonPane from './AddPersonPane';
import ManageCredentialsPane from './ManageCredentialsPane';

/** Workforce Licences and Credentials Register — Workforce (people) and Credentials tabs. */
export default function WorkforceWorkspace({ register }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('workforce');
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const pk = ['workforcePeople', register.id]; const ck = ['workforceCredentials', register.id];
  const peopleQ = useQuery({ queryKey: pk, queryFn: () => listPeople(register.id) });
  const credsQ = useQuery({ queryKey: ck, queryFn: () => listCredentials(register.id) });
  const people = peopleQ.data || [];
  const credentials = credsQ.data || [];
  const isLoading = peopleQ.isLoading || credsQ.isLoading;
  const failure = loadFailure(peopleQ, credsQ);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: pk }), qc.invalidateQueries({ queryKey: ck })]);

  const base = `/compliance/registers/${register.id}/person`;
  const openPerson = (p) => navigate(`${base}/${p.id}`);
  const openInProfile = (c) => navigate(`${base}/${c.person_id}?credential=${c.id}`);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between gap-3 register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground leading-tight truncate">{register.title}</h1>
            <p className="text-xs text-muted-foreground">{people.length} {people.length === 1 ? 'person' : 'people'} · {credentials.length} credential{credentials.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setManageOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Manage Credentials</Button>
          {tab === 'workforce' && <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Person</Button>}
        </div>
      </div>

      <div className="flex-1 overflow-auto register-gutter py-5">
        <CapsuleTabs animated value={tab} onChange={setTab} className="mb-5"
          tabs={[{ value: 'workforce', label: 'Workforce' }, { value: 'credentials', label: 'Credentials' }]} />
        {!isLoading && !failure.isLoadingError && <WorkforceSummaryCards people={people} credentials={credentials} />}
        {failure.isLoadingError ? <LoadError failure={failure} title="Couldn’t load the register" /> : tab === 'workforce'
          ? <WorkforcePeopleTab register={register} people={people} credentials={credentials} isLoading={isLoading} onOpen={openPerson} refresh={refresh} />
          : <CredentialsTab register={register} people={people} credentials={credentials} isLoading={isLoading} onOpenInProfile={openInProfile} />}
      </div>

      <AddPersonPane isOpen={addOpen} register={register} people={people} onClose={() => setAddOpen(false)}
        onDone={async (p) => { await refresh(); openPerson(p); }} />
      <ManageCredentialsPane isOpen={manageOpen} onClose={() => setManageOpen(false)} register={register}
        onSaved={() => Promise.all([refresh(), qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] })])} />
    </div>
  );
}