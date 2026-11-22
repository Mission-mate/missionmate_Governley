import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import { whsConfig } from '@/lib/whsRegister';
import { incidentSections, incidentFields } from '@/lib/whsIncidentFields';
import { pickFields, invalidateWhsRegister } from '@/lib/whsApi';
import HazardDetailsCard from '@/components/compliance/whs/hazard/HazardDetailsCard';
import LinkedActionsSection from '@/components/compliance/whs/hazard/LinkedActionsSection';
import { focusedActionId } from '@/lib/whsActionLinks';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useLinkedCount from '@/components/compliance/whs/hazard/useLinkedCount';
import { saveWhsSource } from '@/lib/whsLifecycle';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import WhsNotesDocsTab, { NOTES_DOCS_TABS } from '@/components/compliance/whs/WhsNotesDocsTab';
import InvestigationNoteLink from '@/components/compliance/whs/incident/InvestigationNoteLink';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'actions', label: 'Actions' },
  ...NOTES_DOCS_TABS,
];

export default function IncidentDetail() {
  const { registerId, incidentId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const actionCount = useLinkedCount('WhsAction', { register_id: registerId, source_type: 'incident', source_id: incidentId });
  const counts = useRecordTabCounts('whs_incident', incidentId);
  const [tab, setTab] = useState(focusedActionId() ? 'actions' : 'overview');
  const { data: register, isLoading: lr, ...registerRead } = useQuery({
    queryKey: ['managedRegister', registerId],
    queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(registerId)),
  });
  const { data: incident, isLoading: li, ...incidentRead } = useQuery({
    queryKey: ['whsIncident', incidentId],
    queryFn: () => getOrNull(() => base44.entities.WhsIncident.get(incidentId)),
  });
  const failure = loadFailure(registerRead, incidentRead);

  if (lr || li) return <div className="h-full flex items-center justify-center"><LoaderOne /></div>;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this incident" />;
  if (!register || !incident || incident.register_id !== registerId) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Incident not found.</div>;
  }

  const back = () => navigate(`/compliance/registers/${registerId}?tab=incidents`);
  const cfg = whsConfig(register);
  const fields = incidentFields(cfg);
  // Section-scoped save: merge the card's fields over the stored incident.
  const saveSection = async (values) => {
    await saveWhsSource('incident', incident.id, pickFields(fields, { ...incident, ...values }));
    qc.invalidateQueries({ queryKey: ['whsLinked', 'WhsAction'] });
    invalidateWhsRegister(qc);
    await qc.invalidateQueries({ queryKey: ['whsIncident', incidentId] });
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <TopBarBack onClick={back}>Back to {register.title}</TopBarBack>
        <div className="mb-6">
          {incident.incident_code && <p className="text-sm font-bold text-muted-foreground mb-1">{incident.incident_code}</p>}
          <h1 className="text-2xl font-bold text-foreground tracking-tight break-words">{incident.title || 'Untitled incident'}</h1>
        </div>
        <div className="mb-6">
          <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: { ...counts, actions: actionCount }[t.value] }))} value={tab} onChange={setTab} />
        </div>
        {tab === 'overview' && <HazardDetailsCard record={incident} sections={incidentSections(cfg, { investigationFooter: () => <InvestigationNoteLink incidentId={incident.id} /> })} onSave={saveSection} />}
        {tab === 'actions' && <LinkedActionsSection cfg={cfg} registerId={registerId} sourceType="incident" sourceId={incident.id} focusId={focusedActionId()} sourceCode={incident.incident_code} />}
        <WhsNotesDocsTab tab={tab} objectType="whs_incident" objectId={incident.id} />
      </div>
    </div>
  );
}