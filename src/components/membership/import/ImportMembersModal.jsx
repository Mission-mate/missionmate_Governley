import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useQuery } from '@tanstack/react-query';
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useCustomFields } from '@/hooks/useCustomFields';
import {
  buildMemberTargetFields, suggestMapping, buildMemberPayloads, buildTemplateCsv, downloadCsv,
} from '@/lib/memberImport';
import MappingRow from '@/components/contacts/import/MappingRow';
import ImportStepper from '@/components/contacts/import/ImportStepper';
import CloseButton from '@/components/shared/CloseButton';
import DuplicateModeChoice from '@/components/membership/import/DuplicateModeChoice';
const STEP = { UPLOAD: 'upload', MAP: 'map', DONE: 'done' };

export default function ImportMembersModal({ isOpen, onClose, onImported, existingMembers = [] }) {
  const { toast } = useToast();
  const { fields: customFields } = useCustomFields('membership');
  const { data: structures = [] } = useQuery({
    queryKey: ['membership_structures'],
    queryFn: () => base44.entities.MembershipStructure.list(),
  });
  const targetFields = buildMemberTargetFields(customFields);

  const [step, setStep] = useState(STEP.UPLOAD);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [duplicateMode, setDuplicateMode] = useState('skip');
  const [result, setResult] = useState({ created: 0, updated: 0, skippedName: 0, skippedDup: 0 });

  // Lowercased email → existing member, used to detect re-imports.
  const existingByEmail = useMemo(() => {
    const map = new Map();
    existingMembers.forEach((m) => {
      if (m.email) map.set(m.email.toLowerCase(), m);
    });
    return map;
  }, [existingMembers]);

  const reset = () => {
    setStep(STEP.UPLOAD);
    setFileName(''); setHeaders([]); setRows([]); setMapping({});
    setDuplicateMode('skip');
    setResult({ created: 0, updated: 0, skippedName: 0, skippedDup: 0 });
  };

  const handleClose = () => { reset(); onClose(); };
  const [baseMapping, setBaseMapping] = useState({});
  const guard = useUnsavedChanges({ draft: mapping, baseline: baseMapping, enabled: step === STEP.MAP, saving: importing, onClose: handleClose, subject: 'column matching' });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields || [];
        if (cols.length === 0) {
          toast({ title: 'Empty file', description: 'No columns detected in this CSV.', variant: 'destructive' });
          return;
        }
        setHeaders(cols);
        setRows(res.data);
        { const s = suggestMapping(cols, targetFields); setMapping(s); setBaseMapping(s); }
        setStep(STEP.MAP);
      },
      error: () => toast({ title: 'Could not read file', variant: 'destructive' }),
    });
  };

  const handleImport = async () => {
    const { creates, updates, skippedName, skippedDup } = buildMemberPayloads(
      rows, mapping, structures, customFields, { existingByEmail, duplicateMode },
    );
    if (creates.length === 0 && updates.length === 0) {
      toast({ title: 'Nothing to import', description: 'No new rows to add.', variant: 'destructive' });
      return;
    }
    setImporting(true);
    const BATCH = 100;
    let created = 0;
    for (let i = 0; i < creates.length; i += BATCH) {
      const chunk = creates.slice(i, i + BATCH);
      await base44.entities.Member.bulkCreate(chunk);
      created += chunk.length;
    }
    let updated = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const chunk = updates.slice(i, i + BATCH);
      await base44.entities.Member.bulkUpdate(chunk);
      updated += chunk.length;
    }
    setResult({ created, updated, skippedName, skippedDup });
    setImporting(false);
    setStep(STEP.DONE);
    await onImported?.();
  };

  const firstNameMapped = Object.values(mapping).includes('first_name');
  const emailMapped = Object.values(mapping).includes('email');

  return (
    <SlidePane isOpen={isOpen} onClose={guard.requestClose}>
      <div className="h-full bg-background flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Import Members</h2>
            <p className="text-sm text-muted-foreground">Upload a CSV and map the columns.</p>
          </div>
          <CloseButton onClick={() => guard.requestClose()} />
        </div>

        {/* Step tracker */}
        <ImportStepper current={step} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === STEP.UPLOAD && (
            <div className="space-y-5">
              <button
                onClick={() => downloadCsv('members-template.csv', buildTemplateCsv())}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Download className="w-4 h-4" /> Download CSV template
              </button>

              <label className="block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Click to upload a CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">Only .csv files are supported</p>
              </label>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>First Name</strong> is required. Other fields are optional and left blank if missing.</p>
                <p>Match <strong>Membership Plan</strong> by its exact name. Status defaults to <strong>active</strong>. Date format for bulk upload is <strong>YYYY/MM/DD</strong>.</p>
              </div>
            </div>
          )}

          {step === STEP.MAP && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 bg-muted/40 rounded-lg px-3 py-2">
                <FileText className="w-4 h-4" />
                <span className="truncate">{fileName}</span>
                <span className="ml-auto shrink-0">{rows.length} rows</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Match each column from your CSV to a field in the application. Unmatched columns are skipped.
              </p>
              {/* Column headings */}
              <div className="flex items-center gap-3 pb-2 mb-1 border-b border-border">
                <div className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  CSV Column
                </div>
                <div className="w-4 shrink-0" />
                <div className="flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Application Field
                </div>
              </div>
              <div className="divide-y divide-border">
                {headers.map((h) => (
                  <MappingRow
                    key={h}
                    header={h}
                    targetFields={targetFields}
                    value={mapping[h]}
                    usedKeys={Object.fromEntries(Object.entries(mapping).filter(([, v]) => v).map(([hdr, v]) => [v, hdr]))}
                    onChange={(v) => setMapping((m) => ({ ...m, [h]: v }))}
                  />
                ))}
              </div>
              {emailMapped && (
                <DuplicateModeChoice value={duplicateMode} onChange={setDuplicateMode} />
              )}
              {!firstNameMapped && (
                <div className="flex items-start gap-2 mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>You must map a column to <strong>First Name</strong> to continue.</span>
                </div>
              )}
            </div>
          )}

          {step === STEP.DONE && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-foreground">Import complete</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {[
                  `${result.created} member${result.created !== 1 ? 's' : ''} imported`,
                  result.updated > 0 && `${result.updated} updated`,
                  result.skippedDup > 0 && `${result.skippedDup} skipped (duplicate)`,
                  result.skippedName > 0 && `${result.skippedName} skipped (no First Name)`,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          {step === STEP.MAP && (
            <>
              <Button variant="outline" onClick={reset} disabled={importing}>Back</Button>
              <Button onClick={handleImport} disabled={!firstNameMapped || importing}>
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : 'Import Members'}
              </Button>
            </>
          )}
          {step === STEP.DONE && <Button onClick={handleClose}>Done</Button>}
          {step === STEP.UPLOAD && <Button variant="outline" onClick={handleClose}>Cancel</Button>}
        </div>
      </div>
      {guard.dialog}
    </SlidePane>
  );
}