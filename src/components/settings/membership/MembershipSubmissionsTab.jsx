import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Inbox } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import CircleCheck from '@/components/shared/CircleCheck';
import { LoaderOne } from '@/components/ui/loaders';
import LoadError from '@/components/shared/states/LoadError';
import { useToast } from '@/components/ui/use-toast';
import Pagination from '@/components/shared/Pagination';
import { formatSubmissionDate } from '@/lib/submissionFormat';
import SubmissionDetailPane from './submissions/SubmissionDetailPane';
import DeleteSubmissionDialog from './submissions/DeleteSubmissionDialog';
import SubmissionsToolbar from './submissions/SubmissionsToolbar';
import SubmissionBulkBar from './submissions/SubmissionBulkBar';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Downloads a submission as a branded PDF via the backend function.
async function downloadSubmissionPdf(submission) {
  const res = await base44.functions.invoke(
    'generateSubmissionPDF',
    { submission_id: submission.id },
    { responseType: 'blob' }
  );
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (submission.member_name || 'submission').replace(/[^a-z0-9]+/gi, '_');
  a.download = `${safeName}_membership_application.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function MembershipSubmissionsTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null); // array of submissions
  const [filters, setFilters] = useState({ plan: '', year: '', month: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: submissions = [], isLoading, isLoadingError, isFetching, refetch } = useQuery({
    queryKey: ['membershipSubmissions'],
    queryFn: () => base44.entities.MembershipApplicationResponse.list('-submitted_at', 1000)
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (q && !(s.member_name || '').toLowerCase().includes(q)) return false;
      if (filters.plan && s.membership_structure_name !== filters.plan) return false;
      if (filters.year || filters.month) {
        const d = new Date(s.submitted_at || s.created_date);
        if (isNaN(d)) return false;
        if (filters.year && String(d.getFullYear()) !== filters.year) return false;
        if (filters.month && MONTHS[d.getMonth()] !== filters.month) return false;
      }
      return true;
    });
  }, [submissions, search, filters]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selected = useMemo(
    () => submissions.filter((s) => selectedIds.includes(s.id)),
    [submissions, selectedIds]
  );

  const handleSearch = (v) => { setSearch(v); setPage(1); };

  const applyFilter = (id, value) => { setFilters((f) => ({ ...f, [id]: value })); setPage(1); };
  const clearFilters = () => { setFilters({ plan: '', year: '', month: '' }); setPage(1); };

  const toggleRow = (id) => setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const allPageSelected = pageItems.length > 0 && pageItems.every((s) => selectedIds.includes(s.id));
  const toggleAll = () => setSelectedIds(allPageSelected ? [] : pageItems.map((s) => s.id));

  const handleDownload = async (submission) => {
    await downloadSubmissionPdf(submission);
  };

  const handleBulkDownload = async () => {
    try {
      for (const s of selected) await downloadSubmissionPdf(s);
    } catch {
      toast({ title: 'Error', description: 'Could not download the PDF.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    for (const s of deleting) await base44.entities.MembershipApplicationResponse.delete(s.id);
    toast({ title: deleting.length > 1 ? 'Submissions deleted' : 'Submission deleted' });
    if (viewing && deleting.some((s) => s.id === viewing.id)) setViewing(null);
    setSelectedIds([]);
    setDeleting(null);
    refetch();
  };

  return (
    <div>
      {/* Intro */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Membership Submissions</h2>
        <p className="text-sm text-muted-foreground">
          New memberships submitted through the Membership Page are saved here.
        </p>
      </div>

      {/* Search + actions */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name…"
            className="pl-9 rounded-[10px]" />
        </div>
        <SubmissionsToolbar
          submissions={submissions}
          filtered={filtered}
          selected={selected}
          activeFilters={filters}
          onApplyFilter={applyFilter}
          onClearFilters={clearFilters} />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/40 border-b border-border text-left">
              <th className="px-4 py-3 w-10">
                <CircleCheck checked={allPageSelected} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle">Membership Plan</th>
              <th className="px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle">Date Submitted</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ?
            <tr><td colSpan={4} className="px-4 py-12"><div className="flex justify-center"><LoaderOne /></div></td></tr> :
            isLoadingError ?
            <tr><td colSpan={4}><LoadError failure={{ isFetching, refetch }} title="Couldn’t load submissions" className="shadow-none dark:ring-0" /></td></tr> :
            pageItems.length === 0 ?
            <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <Inbox className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {search ? 'No submissions match your search.' : 'No membership submissions yet.'}
                  </p>
                </td>
              </tr> :

            pageItems.map((s) =>
            <tr
              key={s.id}
              onClick={() => setViewing(s)}
              className="border-b border-border last:border-0 hover:bg-sidebar-accent/70 cursor-pointer transition-colors">

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <CircleCheck checked={selectedIds.includes(s.id)} onChange={() => toggleRow(s.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.member_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.membership_structure_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatSubmissionDate(s.submitted_at || s.created_date)}</td>
                </tr>
            )
            }
          </tbody>
        </table>
      </div>

      {total > 0 &&
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => {setPageSize(s);setPage(1);}} />

      }

      <SubmissionBulkBar
        count={selected.length}
        onView={() => setViewing(selected[0])}
        onDownload={handleBulkDownload}
        onDelete={() => setDeleting(selected)}
        onClear={() => setSelectedIds([])} />

      <SubmissionDetailPane
        isOpen={!!viewing}
        submission={viewing}
        onClose={() => setViewing(null)}
        onDownload={handleDownload} />


      <DeleteSubmissionDialog
        isOpen={!!deleting}
        submission={deleting?.[0]}
        count={deleting?.length || 1}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete} />

    </div>);

}