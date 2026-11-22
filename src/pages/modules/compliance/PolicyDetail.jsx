import React, { useState } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { Link, useParams } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import PolicyAvatar from '@/components/compliance/policies/PolicyAvatar';
import PolicyBadge from '@/components/compliance/policies/PolicyBadge';
import LinkedDocumentsCard from '@/components/compliance/policies/LinkedDocumentsCard';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import LinkExistingDialog from '@/components/compliance/policies/LinkExistingDialog';
import PolicyFormPane from '@/components/compliance/policies/PolicyFormPane';
import PolicyDocumentViewer from '@/components/compliance/policies/viewer/PolicyDocumentViewer';
import PolicyAssistant from '@/components/compliance/policies/viewer/PolicyAssistant';
import { motion } from 'framer-motion';
import usePolicyData from '@/hooks/usePolicyData';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import PolicyDetailsTab from '@/components/compliance/policies/PolicyDetailsTab';
import VersionsTab from '@/components/compliance/policies/versions/VersionsTab';
import { childrenOf, unlinkPolicy } from '@/lib/policies';
import { loadPolicyContent } from '@/lib/policyContent';
import { listVersions, versionsKey } from '@/lib/policyVersions';

const TABS = [{ value: 'details', label: 'Details' }, { value: 'preview', label: 'Preview' }, { value: 'versions', label: 'Versions' }];

export default function PolicyDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { docs, categories, types, columns, isLoading, failure, refresh } = usePolicyData();
  const [form, setForm] = useState(null); // { parentId } — Add linked document
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(null);
  const [tab, setTab] = useState('details');
  const [flash, setFlash] = useState(null);
  const [aiOpen, setAiOpen] = useState(true);
  // Entering Preview always re-opens the assistant (the contents rail remounts collapsed).
  const changeTab = (t) => { if (t === 'preview') setAiOpen(true); setTab(t); };
  const doc = docs.find((d) => d.id === id);
  const content = useQuery({
    queryKey: ['policyContent', id, doc?.primary_file_uri], enabled: !!doc, staleTime: Infinity,
    queryFn: async () => { const s = await loadPolicyContent(doc); if (!doc.content_sections?.length && s.length) qc.invalidateQueries({ queryKey: ['policyDocuments'] }); return s; },
  });

  const versions = useQuery({ queryKey: versionsKey(id), enabled: !!doc, queryFn: () => listVersions(doc) });
  const current = versions.data?.find((v) => v.status === 'Current');

  if (isLoading) return <div className="flex justify-center py-24"><LoaderOne size="lg" /></div>;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this document" />;
  if (!doc) return <div className="p-8 text-center text-sm text-muted-foreground">Document not found. <Link to="/compliance/policy" className="text-primary">Back to policies</Link></div>;
  const parent = docs.find((d) => d.id === doc.parent_id);
  const sections = content.data || [];
  const jump = (i) => {
    document.getElementById(`policy-sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const f = { index: i }; setFlash(f);
    setTimeout(() => setFlash((cur) => (cur === f ? null : cur)), 3000);
  };

  return (
    <div className={`p-4 lg:p-6 max-w-7xl w-full mx-auto flex flex-col gap-4 ${tab === 'details' ? '' : 'lg:h-[calc(100vh-4rem)]'}`}>
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <TopBarBack to="/compliance/policy">Back to Policy Management</TopBarBack>
          <div className="flex items-center gap-3 min-w-0">
            <PolicyAvatar title={doc.title} className="w-10 h-10 text-lg" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground tracking-tight truncate">{doc.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">{current && <span className="text-xs font-medium text-foreground/80">Version {current.version_number} ·</span>}<span className="text-xs text-muted-foreground"><span className="text-xs font-semibold text-foreground/80">Type:</span> {doc.document_type}</span><span className="text-xs font-semibold text-foreground/80 ml-1">Stage:</span><PolicyBadge value={doc.stage} /><span className="text-xs font-semibold text-foreground/80 ml-1">Status:</span><PolicyBadge value={doc.status} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0"><CapsuleTabs animated value={tab} onChange={changeTab} tabs={TABS.map((t) => (t.value === 'versions' ? { ...t, count: versions.data?.length } : t))} /></div>

      {tab === 'preview' && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.25, 1] }}
          className={`flex-1 min-h-0 flex flex-col lg:flex-row bg-card border border-border rounded-[14px] overflow-hidden shadow-[0_8px_28px_rgba(15,23,42,.07)]`}>
          <div className="flex-1 h-[70vh] lg:h-auto min-h-0 min-w-0"><PolicyDocumentViewer doc={doc} sections={sections} loading={content.isLoading} error={content.isError ? "Couldn't read this document." : ''} flash={flash} aiOpen={aiOpen} onAskAi={() => setAiOpen(true)} /></div>
          <div aria-hidden={!aiOpen} inert={aiOpen ? undefined : ''}
            className={`shrink-0 overflow-hidden min-h-0 transition-[max-height,width,opacity] duration-300 ease-in-out motion-reduce:transition-none lg:max-h-none lg:h-auto ${aiOpen ? 'max-h-[80vh] opacity-100 lg:w-[380px]' : 'max-h-0 opacity-0 lg:w-0'}`}>
            <div className={`h-[80vh] lg:h-full lg:w-[380px] transition-transform duration-300 ease-in-out motion-reduce:transition-none ${aiOpen ? 'translate-x-0' : 'lg:translate-x-6'}`}>
              <PolicyAssistant doc={doc} sections={sections} ready={sections.length > 0} loading={content.isLoading} onJump={jump} onClose={() => setAiOpen(false)} />
            </div>
          </div>
        </motion.div>
      )}
      {tab === 'details' && (
        <div className="pb-6">
          <PolicyDetailsTab key={doc.id} doc={doc} parent={parent} docs={docs} types={types} columns={columns} categories={categories} onSaved={refresh}
            linked={!parent && <LinkedDocumentsCard children={childrenOf(docs, doc.id)} onAddNew={() => setForm({ parentId: doc.id })}
              onLinkExisting={() => setLinkOpen(true)} onUnlink={setUnlinking} />} />
        </div>
      )}
      {tab === 'versions' && (
        <div className="flex-1 min-h-0 overflow-y-auto -mx-3 px-3 pt-1 pb-8"><VersionsTab doc={doc} onChanged={refresh} /></div>
      )}

      <PolicyFormPane isOpen={!!form} doc={null} defaultParentId={form?.parentId} docs={docs} types={types} columns={columns} categories={categories} onClose={() => setForm(null)} onSaved={refresh} />
      <ConfirmTypeDialog isOpen={!!unlinking} title="Unlink document" keyword="CONFIRM" confirmLabel="Unlink"
        message={`"${unlinking?.title}" will be unlinked from this policy. The document itself is not deleted.`}
        onClose={() => setUnlinking(null)} onConfirm={guardAction(async () => { await unlinkPolicy(unlinking.id); setUnlinking(null); refresh(); }, 'Could not unlink the document')} />
      <LinkExistingDialog isOpen={linkOpen} onClose={() => setLinkOpen(false)} parent={doc} docs={docs} onLinked={refresh} />
    </div>
  );
}