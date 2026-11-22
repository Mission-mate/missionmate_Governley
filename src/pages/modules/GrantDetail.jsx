import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Calendar, Clock, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import GrantOverviewTab from '@/components/grants/detail/GrantOverviewTab';
import GrantReportingTab from '@/components/grants/detail/GrantReportingTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import NotesTab from '@/components/notes/NotesTab';
import FinancialManagement from '@/components/grants/detail/financials/FinancialManagement';
import GrantSummaryTiles from '@/components/grants/detail/GrantSummaryTiles';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import { GRANTS_QUERY_KEY, REPORTING_OBLIGATIONS_QUERY_KEY } from '@/hooks/useGrantQueries';

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  closed: 'bg-blue-50 text-blue-700 border border-blue-200',
  archived: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'reporting', label: 'Obligations' },
  { id: 'financials', label: 'Financials' },
  { id: 'notes', label: 'Notes' },
  { id: 'documents', label: 'Documents' },
];

function fmtDate(d) {
  if (!d) return '–';
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

function fmtAmount(n) {
  if (!n && n !== 0) return '–';
  return '$' + Number(n).toLocaleString();
}

export default function GrantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  // The ?tab= param is the single source of truth, so deep links and
  // Back/Forward always land on the right tab — even without a remount.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const isValidTab = TABS.some(t => t.id === tabParam);
  const activeTab = isValidTab ? tabParam : 'overview';

  // Strip an invalid tab param — a silent correction, so never push history.
  useEffect(() => {
    if (tabParam !== null && !isValidTab) {
      setSearchParams({}, { replace: true });
    }
  }, [tabParam, isValidTab, setSearchParams]);

  const leave = usePageLeaveGuard();
  const counts = useRecordTabCounts('grant', id, { obligations: true });
  const tabCount = { reporting: counts.obligations, documents: counts.documents, notes: counts.notes };
  const { data: grant, isLoading, ...grantRead } = useQuery({
    queryKey: ['grant', id],
    queryFn: () => base44.entities.Grant.filter({ id }),
    select: data => data?.[0],
    enabled: !!id,
  });

  const { data: obligations = [], isLoading: loadingObligations, ...obligationsRead } = useQuery({
    queryKey: ['reporting-obligations', id],
    queryFn: () => base44.entities.ReportingObligation.filter({ grant_id: id }),
    enabled: !!id,
  });

  // Total Awarded reflects the live Funding Breakdown total (sum of funding rows).
  // Reuses the same query key as the Financials tab so it stays in sync after edits.
  const { data: financialEntries = [], isLoading: loadingFinancials, ...financialsRead } = useQuery({
    queryKey: ['financial-entries', 'grant', id],
    queryFn: () => base44.entities.FinancialEntry.filter({ parent_type: 'grant', parent_id: id }, 'sort_order'),
    enabled: !!id,
  });
  const fundingRows = financialEntries.filter(e => e.type === 'funding');
  const fundingTotal = fundingRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  // Funding Breakdown is the authoritative source; grant.total_amount is only a
  // cached summary for list views, so never fall back to it here.
  const totalAwarded = fundingTotal;

  // Edits here must also refresh the shared portfolio-wide lists so the Grant
  // Register and Dashboard reflect the change when the user navigates back.
  const invalidateGrant = () => {
    qc.invalidateQueries({ queryKey: ['grant', id] });
    qc.invalidateQueries({ queryKey: GRANTS_QUERY_KEY });
  };
  const invalidateObligations = () => {
    qc.invalidateQueries({ queryKey: ['reporting-obligations', id] });
    qc.invalidateQueries({ queryKey: REPORTING_OBLIGATIONS_QUERY_KEY });
  };

  // Next upcoming deadline from reporting obligations (not completed)
  const nextDeadline = obligations
    .filter(o => o.status !== 'complete' && o.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <ModuleLoader fullPage />
    );
  }

  const failure = loadFailure(grantRead, obligationsRead, financialsRead);
  if (failure.isLoadingError) {
    return <LoadError page failure={failure} title="Couldn’t load this grant" />;
  }

  if (!grant) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Grant not found.</p>
        <Link to="/grants/register" className="text-primary text-sm mt-2 inline-block">← Back to Register</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back nav */}
      {leave.dialog}
      <TopBarBack onClick={() => leave.guard(() => navigate('/grants/register'))}>Back to Grant Register</TopBarBack>

      {/* Grant Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1.5">
          <h1 className="text-2xl font-bold text-foreground">{grant.name}</h1>
          <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', STATUS_STYLES[grant.status])}>
            {grant.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="w-3.5 h-3.5" />
          <span>{grant.provider}</span>
          {grant.reference_id && (
            <>
              <span className="mx-1">•</span>
              <span>Ref: {grant.reference_id}</span>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {(loadingObligations || loadingFinancials) ? <ModuleLoader /> : <GrantSummaryTiles
        totalAwarded={totalAwarded}
        startDate={grant.start_date}
        endDate={grant.end_date}
        nextDeadline={nextDeadline}
        fmtDate={fmtDate}
        fmtAmount={fmtAmount}
      />}

      {/* Tabs — capsule style matching contacts */}
      <div className="mb-6 overflow-x-auto">
        <CapsuleTabs animated
          value={activeTab}
          onChange={(v) => { if (v !== activeTab) leave.guard(() => setSearchParams({ tab: v })); }}
          tabs={TABS.map((t) => ({ value: t.id, label: t.label, count: tabCount[t.id] }))}
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <GrantOverviewTab grant={grant} onUpdate={invalidateGrant} />
      )}
      {activeTab === 'reporting' && (
        <GrantReportingTab
          grant={grant}
          obligations={obligations}
          currentUser={currentUser}
          isLoading={loadingObligations}
          onRefresh={invalidateObligations}
        />
      )}
      {activeTab === 'financials' && (
        <FinancialManagement parentId={grant.id} currentUser={currentUser} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab objectType="grant" objectId={grant.id} currentUser={currentUser} />
      )}
      {activeTab === 'notes' && (
        <NotesTab objectType="grant" objectId={grant.id} currentUser={currentUser} />
      )}
    </div>
  );
}