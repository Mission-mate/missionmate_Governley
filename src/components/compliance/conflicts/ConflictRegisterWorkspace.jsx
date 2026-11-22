import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ConflictOfInterestTab from '@/components/board/conflicts/ConflictOfInterestTab';
import AssetCustomiserPane from '@/components/compliance/assets/AssetCustomiserPane';
import { getAssetCustomColumns } from '@/lib/assetRegister';
import { ConflictScopeContext, listScopePeople } from '@/lib/conflictScope';
import { listConflicts } from '@/lib/conflictOfInterest';
import { DECLARANT_SYSTEM_FIELDS, getDeclarantOptions, CUSTOMISER_ENTITY, activeDeclarations } from '@/lib/declarantRegister';
import DeclarantsTab from './DeclarantsTab';
import AddDeclarantPane from './AddDeclarantPane';

/**
 * Compliance Conflict of Interest Register — Declarants Register (people) and
 * Declarations Register (every declaration, read-only; edits happen in the profile).
 */
export default function ConflictRegisterWorkspace({ register }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('declarants');
  const [customOpen, setCustomOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const customColumns = useMemo(() => getAssetCustomColumns(register), [register]);
  const scope = useMemo(
    () => ({ registerId: register.id, personLabel: 'Person', title: register.title, customColumns }),
    [register.id, register.title, customColumns]
  );

  const peopleQ = useQuery({ queryKey: ['coiPeople', register.id], queryFn: () => listScopePeople(register.id) });
  const conflictsQ = useQuery({ queryKey: ['conflictsOfInterest', register.id], queryFn: () => listConflicts(register.id) });
  const people = peopleQ.data || [];
  const conflicts = conflictsQ.data || [];
  const failure = loadFailure(peopleQ, conflictsQ);
  const activeConflicts = useMemo(() => activeDeclarations(conflicts, people), [conflicts, people]);
  const activeCount = activeConflicts.length;

  const base = `/compliance/registers/${register.id}/declarant`;
  const openDeclarant = (p) => navigate(`${base}/${p.id}`);
  const openInProfile = (c) => c.member_user_id && navigate(`${base}/${c.member_user_id}?declaration=${c.id}`);

  const handleSaved = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] }),
    qc.invalidateQueries({ queryKey: ['conflictsOfInterest', register.id] }),
    qc.invalidateQueries({ queryKey: ['coiPeople', register.id] }),
  ]);
  const switchTab = (t) => { setCustomOpen(false); setTab(t); };

  return (
    <ConflictScopeContext.Provider value={scope}>
      <div className="flex flex-col h-full bg-background">
        <div className="relative z-30 flex items-center justify-between register-gutter py-3 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-3">
            <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
              <p className="text-xs text-muted-foreground">{people.length} declarant{people.length !== 1 ? 's' : ''} · {activeCount} declaration{activeCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'declarants' && (
              <>
                <Button variant="outline" onClick={() => setCustomOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
                <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Declarant</Button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto register-gutter py-5">
          <CapsuleTabs animated value={tab} onChange={switchTab} className="mb-5"
            tabs={[{ value: 'declarants', label: 'Declarants Register', count: people.length }, { value: 'declarations', label: 'Declarations Register', count: activeCount }]} />
          {failure.isLoadingError ? <LoadError failure={failure} title="Couldn’t load the register" /> : tab === 'declarants'
            ? <DeclarantsTab register={register} people={people} conflicts={conflicts} activeConflicts={activeConflicts} isLoading={peopleQ.isLoading || conflictsQ.isLoading} onOpen={openDeclarant} />
            : <ConflictOfInterestTab onOpenInProfile={openInProfile} />}
        </div>
      </div>

      <AddDeclarantPane isOpen={addOpen} register={register} people={people} onClose={() => setAddOpen(false)} onDone={openDeclarant} />
      <AssetCustomiserPane
        isOpen={customOpen}
        register={register}
        fields={DECLARANT_SYSTEM_FIELDS}
        getOptions={getDeclarantOptions}
        entity={CUSTOMISER_ENTITY}
        itemNoun="declarant"
        subtitle="Manage conflict of interest register fields"
        onClose={() => setCustomOpen(false)}
        onSaved={handleSaved}
      />
    </ConflictScopeContext.Provider>
  );
}