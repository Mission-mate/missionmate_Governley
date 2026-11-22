import React, { useState } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { Plus, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import WhsCustomiserPane from './WhsCustomiserPane';
import { actionFields } from '@/lib/whsHazardFields';
import { sourceActionPath } from '@/lib/whsActionLinks';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { WHS_TABS } from '@/lib/whsTabs';
import { whsConfig, hazardRating } from '@/lib/whsRegister';
import { hazardSections } from '@/lib/whsHazardFields';
import { incidentSections } from '@/lib/whsIncidentFields';
import { checkSections } from '@/lib/whsCheckFields';
import { nextRecordCode, pickFields, invalidateWhsRegister } from '@/lib/whsApi';
import WhsFormPane from './hazard/WhsFormPane';
import WhsRegisterTab from './WhsRegisterTab';
import useWhsOpenCounts from './useWhsOpenCounts';

const TAB_KEYS = Object.keys(WHS_TABS);

/** Tabs whose records open a dedicated detail page, with how to create them. */
const DETAIL_TABS = {
  hazards: { path: 'hazard', sections: hazardSections, codeField: 'hazard_code', prefix: 'HZ', title: 'Add Hazard',
    finalize: (clean) => ({ ...clean, risk_rating: hazardRating(clean) || null }) },
  incidents: { path: 'incident', sections: (cfg) => incidentSections(cfg), codeField: 'incident_code', prefix: 'INC', title: 'Report Incident',
    finalize: (clean) => clean },
  checks: { path: 'check', sections: checkSections, codeField: 'check_code', prefix: 'CHK', title: 'Add Safety Check',
    finalize: (clean) => clean },
};

export default function WhsWorkspace({ register }) {
  const openCounts = useWhsOpenCounts(register.id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = WHS_TABS[params.get('tab')] ? params.get('tab') : 'hazards';
  const setTab = (t) => setParams({ tab: t }, { replace: true });
  const [draft, setDraft] = useState(null);
  const cfg = WHS_TABS[tab];
  const detail = DETAIL_TABS[tab];
  const creatable = !!detail?.sections;
  const sections = creatable ? detail.sections(whsConfig(register)) : [];
  const fields = sections.flatMap((s) => s.fields);
  const [viewAction, setViewAction] = useState(null);
  const [customOpen, setCustomOpen] = useState(false);
  const qc = useQueryClient();
  // Actions are view-only here; they are edited and deleted in their source record's Actions tab.
  const openRecord = (r) => (detail ? navigate(`/compliance/registers/${register.id}/${detail.path}/${r.id}`) : setViewAction(r));
  const editAtSource = (a) => navigate(sourceActionPath(a));

  const start = guardAction(async () => {
    const code = await nextRecordCode(cfg.entity, detail.codeField, detail.prefix, register.id);
    setDraft({ [detail.codeField]: code, status: 'Open', register_id: register.id });
  }, 'Could not start a new record');
  const create = async (values) => {
    const created = await base44.entities[cfg.entity].create({ ...detail.finalize(pickFields(fields, values)), register_id: register.id });
    openRecord(created);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between gap-3 register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground leading-tight truncate">{register.title}</h1>
            <p className="text-xs text-muted-foreground">Work Health and Safety</p>
          </div>
        </div>
        {creatable && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => setCustomOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
            <Button onClick={start}><Plus className="w-4 h-4" /> {cfg.addLabel}</Button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto register-gutter py-5">
        <div className="mb-5">
          <CapsuleTabs animated value={tab} onChange={(t) => { setTab(t); setDraft(null); }} tabs={TAB_KEYS.map((k) => ({ value: k, label: WHS_TABS[k].tabLabel, count: openCounts[k] }))} />
        </div>
        <WhsRegisterTab key={tab} tabKey={tab} cfg={cfg} register={register} onOpenRecord={openRecord} onEditRecord={detail ? undefined : editAtSource} />
      </div>
      <WhsFormPane open={!!viewAction} readOnly title={viewAction?.title} fields={actionFields(whsConfig(register))} initial={viewAction}
        editIcon={ExternalLink} editLabel={`Open in ${viewAction?.source_code || 'source'}`}
        onEdit={() => editAtSource(viewAction)} onClose={() => setViewAction(null)} />
      {creatable && <WhsCustomiserPane key={tab} isOpen={customOpen} register={register} tabKey={tab} label={cfg.label}
        onClose={() => setCustomOpen(false)}
        onSaved={() => Promise.all([qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] }), invalidateWhsRegister(qc)])} />}
      {creatable && <WhsFormPane open={!!draft} title={detail.title} sections={sections} initial={draft} onSave={create} onClose={() => setDraft(null)} />}
    </div>
  );
}