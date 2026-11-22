import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import WorkforceDetailCards from '@/components/compliance/workforce/WorkforceDetailCards';
import CredentialsRegisterSection from '@/components/compliance/workforce/CredentialsRegisterSection';
import { listPeople, listCredentials } from '@/lib/workforceRegister';

export default function WorkforcePersonDetail() {
  const { registerId, personId } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const leave = usePageLeaveGuard();
  const back = `/compliance/registers/${registerId}`;

  const { data: register, ...registerRead } = useQuery({ queryKey: ['complianceManagedRegister', registerId], queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(registerId)) });
  const { data: people = [], isLoading, ...peopleRead } = useQuery({ queryKey: ['workforcePeople', registerId], queryFn: () => listPeople(registerId) });
  const { data: credentials = [], isLoading: lc, ...credentialsRead } = useQuery({ queryKey: ['workforceCredentials', registerId], queryFn: () => listCredentials(registerId) });
  const person = people.find((p) => p.id === personId);
  const ownCreds = useMemo(() => credentials.filter((c) => c.person_id === personId), [credentials, personId]);
  const refresh = () => Promise.all(['workforcePeople', 'workforceCredentials'].map((k) => qc.invalidateQueries({ queryKey: [k, registerId] })));

  const failure = loadFailure(registerRead, peopleRead, credentialsRead);
  if (isLoading || lc || registerRead.isLoading) return <ModuleLoader fullPage />;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this profile" />;
  if (!person || !register) return <div className="p-8 text-sm text-muted-foreground">Profile not found. <Link to={back} className="text-primary">Back to Credentials Register</Link></div>;

  return (
    <div className="h-full overflow-auto bg-background">
      {leave.dialog}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <TopBarBack onClick={() => leave.guard(() => navigate(back))}>Back to Credentials Register</TopBarBack>
        <div className="flex items-center gap-4">
          <PersonInitialsAvatar name={person.full_name} className="h-14 w-14 text-lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">{person.full_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              {person.person_type && <span className="text-xs font-medium rounded px-2 py-0.5 bg-primary/10 text-primary">{person.person_type}</span>}
              {person.role && <span className="truncate">{person.person_type ? '· ' : ''}{person.role}</span>}
            </div>
          </div>
        </div>
        <WorkforceDetailCards key={person.updated_date} person={person} people={people} credentials={credentials} onSaved={refresh} />
        <CredentialsRegisterSection register={register} person={person} credentials={ownCreds} onChanged={refresh} />
      </div>
    </div>
  );
}