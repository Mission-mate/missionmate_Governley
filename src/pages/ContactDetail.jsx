import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2 } from 'lucide-react';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import { useContactTypeConfig } from '@/hooks/useContactTypeConfig';
import { CONTACT_TYPE_FIELD_ID, CONTACT_TYPE_BADGE_CLASSES } from '@/lib/contactTypeConfig';
import ContactInformationTab from '@/components/contacts/detail/ContactInformationTab';
import NotesTab from '@/components/notes/NotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull } from '@/lib/readState';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';

const TABS = [
{ id: 'contact_info', label: 'Overview' },
{ id: 'notes', label: 'Notes' },
{ id: 'documents', label: 'Documents' }];


function getInitials(first, last) {
  return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();
}

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  // The ?tab= param is the single source of truth, so deep links and
  // Back/Forward always land on the right tab — even without a remount.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const isValidTab = TABS.some((t) => t.id === tabParam);
  const activeTab = isValidTab ? tabParam : 'contact_info';

  // Strip an invalid tab param — a silent correction, so never push history.
  useEffect(() => {
    if (tabParam !== null && !isValidTab) {
      setSearchParams({}, { replace: true });
    }
  }, [tabParam, isValidTab, setSearchParams]);

  const { config: ctConfig } = useContactTypeConfig();
  const leave = usePageLeaveGuard();
  const counts = useRecordTabCounts('contact', id);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: contact, isLoading, ...read } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getOrNull(() => base44.entities.Contact.get(id)),
    enabled: !!id
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ['contact', id] });

  if (isLoading) {
    return <ModuleLoader fullPage />;
  }

  if (read.isLoadingError) {
    return <LoadError page failure={read} title="Couldn’t load this contact" />;
  }

  if (!contact) {
    return (
      <div className="p-8 text-center text-muted-foreground">Contact not found.</div>);

  }

  const initials = getInitials(contact.first_name, contact.last_name);
  const rawType = contact.custom_fields?.[CONTACT_TYPE_FIELD_ID];
  const typeValues = Array.isArray(rawType) ? rawType : (rawType ? [rawType] : []);
  const typeBadges = typeValues.map((v) => ctConfig.options.find((o) => o.value === v)?.label || v);

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Back */}
      {leave.dialog}
      <TopBarBack onClick={() => leave.guard(() => navigate('/contacts'))}>Back to Contacts</TopBarBack>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {contact.avatar_url ?
          <img src={contact.avatar_url} className="w-14 h-14 rounded-full object-cover" alt="" /> :
          <span className="text-primary font-bold text-xl">{initials}</span>
          }
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {contact.first_name} {contact.last_name}
            </h1>
            {typeBadges.map((label) => (
              <span key={label} className={CONTACT_TYPE_BADGE_CLASSES}>
                {label}
              </span>
            ))}
          </div>
          {contact.company &&
          <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              {contact.company}
            </div>
          }
        </div>
      </div>

      {/* Tab bar — modern capsule style */}
      <div className="mb-6 overflow-x-auto">
        <CapsuleTabs animated
          value={activeTab}
          onChange={(v) => { if (v !== activeTab) leave.guard(() => setSearchParams({ tab: v })); }}
          tabs={TABS.map((t) => ({ value: t.id, label: t.label, count: counts[t.id] }))}
        />
      </div>

      {/* Tab content */}
      <ErrorBoundary resetKey={`${contact.id}:${activeTab}`}>
        {activeTab === 'contact_info' && <ContactInformationTab contact={contact} onSaved={refetch} />}
        {activeTab === 'notes' &&
        <NotesTab objectType="contact" objectId={contact.id} currentUser={currentUser} />
        }
        {activeTab === 'documents' &&
        <DocumentsTab objectType="contact" objectId={contact.id} />
        }
      </ErrorBoundary>
    </div>);

}