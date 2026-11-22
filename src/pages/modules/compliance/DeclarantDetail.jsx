import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import { listScopePeople } from '@/lib/conflictScope';
import { listConflicts } from '@/lib/conflictOfInterest';
import { DECLARANT_STATUS_OPTIONS } from '@/lib/declarantRegister';
import DeclarantDetailCards from '@/components/compliance/conflicts/DeclarantDetailCards';
import DeclarantDeclarationsSection from '@/components/compliance/conflicts/DeclarantDeclarationsSection';

/** Declarant profile — mirrors the Donor profile: header, two inline-edit cards, then their declarations. */
export default function DeclarantDetail() {
  const { registerId, declarantId } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const leave = usePageLeaveGuard();
  const back = `/compliance/registers/${registerId}`;

  const { data: register, ...registerRead } = useQuery({ queryKey: ['complianceManagedRegister', registerId], queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(registerId)) });
  const { data: people = [], isLoading, ...peopleRead } = useQuery({ queryKey: ['coiPeople', registerId], queryFn: () => listScopePeople(registerId) });
  // Same query as the declarations table below, so the page shows one loader until both are ready.
  const { data: conflicts = [], isLoading: conflictsLoading, ...conflictsRead } = useQuery({ queryKey: ['conflictsOfInterest', registerId], queryFn: () => listConflicts(registerId) });
  const person = people.find((p) => p.id === declarantId);
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['coiPeople', registerId] }),
    qc.invalidateQueries({ queryKey: ['conflictsOfInterest', registerId] }),
  ]);

  const failure = loadFailure(registerRead, peopleRead, conflictsRead);
  if (isLoading || conflictsLoading || registerRead.isLoading) return <ModuleLoader fullPage />;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this declarant" />;
  if (!person || !register) return <div className="p-8 text-sm text-muted-foreground">Declarant not found. <Link to={back} className="text-primary">Back to Conflict of Interest Register</Link></div>;

  return (
    <div className="h-full overflow-auto bg-background">
      {leave.dialog}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <TopBarBack onClick={() => leave.guard(() => navigate(back))}>Back to Conflict of Interest Register</TopBarBack>
        <div className="flex items-center gap-4">
          <PersonInitialsAvatar name={person.full_name} className="h-14 w-14 text-lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">{person.full_name}</h1>
              <AssetBadge value={person.status || 'Active'} options={DECLARANT_STATUS_OPTIONS} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{[person.declarant_code, person.role, person.email].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <DeclarantDetailCards key={person.updated_date} person={person} people={people} conflicts={conflicts} register={register} onSaved={refresh} />
        <DeclarantDeclarationsSection register={register} person={person} />
      </div>
    </div>
  );
}