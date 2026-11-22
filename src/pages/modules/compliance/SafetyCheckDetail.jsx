import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQueryClient } from '@tanstack/react-query';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import { whsConfig } from '@/lib/whsRegister';
import { checkSections, checkFields } from '@/lib/whsCheckFields';
import { pickFields, invalidateWhsRegister } from '@/lib/whsApi';
import useWhsRecord from '@/components/compliance/whs/hazard/useWhsRecord';
import HazardDetailsCard from '@/components/compliance/whs/hazard/HazardDetailsCard';
import LinkedActionsSection from '@/components/compliance/whs/hazard/LinkedActionsSection';
import { focusedActionId } from '@/lib/whsActionLinks';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useLinkedCount from '@/components/compliance/whs/hazard/useLinkedCount';
import { saveWhsSource } from '@/lib/whsLifecycle';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import WhsNotesDocsTab, { NOTES_DOCS_TABS } from '@/components/compliance/whs/WhsNotesDocsTab';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'actions', label: 'Actions' },
  ...NOTES_DOCS_TABS,
];

export default function SafetyCheckDetail() {
  const { registerId, checkId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const actionCount = useLinkedCount('WhsAction', { register_id: registerId, source_type: 'safety_check', source_id: checkId });
  const counts = useRecordTabCounts('whs_safety_check', checkId);
  const [tab, setTab] = useState(focusedActionId() ? 'actions' : 'overview');
  const { register, record: check, isLoading, failure, queryKey } = useWhsRecord('WhsSafetyCheck', registerId, checkId);

  if (isLoading) return <div className="h-full flex items-center justify-center"><LoaderOne /></div>;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this safety check" />;
  if (!register || !check) return <div className="p-10 text-center text-sm text-muted-foreground">Safety check not found.</div>;

  const back = () => navigate(`/compliance/registers/${registerId}?tab=checks`);
  const cfg = whsConfig(register);
  const fields = checkFields(cfg);
  // Section-scoped save: merge the card's fields over the stored check.
  const saveSection = async (values) => {
    await saveWhsSource('safety_check', check.id, pickFields(fields, { ...check, ...values }));
    qc.invalidateQueries({ queryKey: ['whsLinked', 'WhsAction'] });
    invalidateWhsRegister(qc);
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <TopBarBack onClick={back}>Back to {register.title}</TopBarBack>
        <div className="mb-6">
          {check.check_code && <p className="text-sm font-bold text-muted-foreground mb-1">{check.check_code}</p>}
          <h1 className="text-2xl font-bold text-foreground tracking-tight break-words">{check.title || 'Untitled safety check'}</h1>
        </div>
        <div className="mb-6">
          <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: { ...counts, actions: actionCount }[t.value] }))} value={tab} onChange={setTab} />
        </div>
        {tab === 'overview' && <HazardDetailsCard record={check} sections={checkSections(cfg)} onSave={saveSection} />}
        {tab === 'actions' && <LinkedActionsSection cfg={cfg} registerId={registerId} sourceType="safety_check" sourceId={check.id} focusId={focusedActionId()} sourceCode={check.check_code} />}
        <WhsNotesDocsTab tab={tab} objectType="whs_safety_check" objectId={check.id} />
      </div>
    </div>
  );
}