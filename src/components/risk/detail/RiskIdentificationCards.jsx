import React from 'react';
import { Calendar } from 'lucide-react';
import PersonName from '@/components/risk/PersonName';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REVIEW_FREQUENCIES, calcNextReviewDate, formatReviewDate } from '@/lib/reviewDateUtils';
import NextReviewDisplay from '@/components/risk/NextReviewDisplay';
import RichTextField from '@/components/risk/RiskRichTextField';
import { sanitizeRiskHtml } from '@/lib/riskHtml';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { getStatusStyle, getAppetiteStyle } from './statusStyles';
import DateField from '@/components/ui/DateField';
import ColoredSelect from '@/components/risk/ColoredSelect';
import { categoryStyleFn } from '@/lib/riskCategoryStyle';

const NEXT_REVIEW_HELP = 'Updating the Last Review Date automatically recalculates the Next Review Date.';

function ReadField({ label, children, icon: Icon, tooltip }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </p>
      <div className="flex items-center gap-2 text-sm text-foreground">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <span className="whitespace-pre-wrap">{children || '—'}</span>
      </div>
    </div>);

}

function EditLabel({ children }) {
  return <Label className="mb-1.5 block text-xs font-medium text-foreground">{children}</Label>;
}

/**
 * Section card shell — elevated surface, header Edit trigger, bottom-right
 * Cancel / Save Changes footer while editing.
 */
function CardShell({ title, editing, onEdit, editDisabled, onCancel, onSave, saving, children }) {
  return (
    <div className={ELEVATED_SECTION}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-base">{title}</h3>
        {!editing && <SectionEditButton onClick={onEdit} disabled={editDisabled} />}
      </div>
      {children}
      {editing && <CardEditFooter onCancel={onCancel} onSave={onSave} saving={saving} />}
    </div>);

}

/**
 * Risk Identification / Details / Analysis cards.
 * Edit orchestration is owned by the page-wide mutex in RiskDetail — this
 * component is presentational and reports changes upward.
 */
export default function RiskIdentificationCards({
  risk,
  statusOptions,
  categoryOptions,
  appetiteOptions,
  draft,
  onDraftChange,
  editingSection,
  requestEdit,
  closeEdit,
  editBlocked,
  onSaveKeys,
  idError,
  saving
})
{
  const d = draft || {};

  const catOpts = (categoryOptions || []).map((o) => typeof o === 'object' ? o.name : o);
  const statusOpts = (statusOptions || []).map((o) => typeof o === 'object' ? o.name : o);
  const appetiteOpts = (appetiteOptions || []).map((o) => typeof o === 'object' ? o.name : o);
  const appetiteList = appetiteOpts.length ? appetiteOpts : ['Within Appetite', 'Outside Appetite'];

  const upd = (fields) => onDraftChange(fields);

  // Recalculate the next review date from frequency + last reviewed date.
  const recalcNextReview = (next) => {
    const freq = next.review_frequency;
    const base = next.last_reviewed_date;
    if (!freq || freq === 'Ad Hoc') return null;
    if (!base) return null;
    return calcNextReviewDate(freq, {
      baseDate: base,
      intervalValue: next.interval_value,
      intervalUnit: next.interval_unit
    });
  };

  const updReview = (fields) => {
    const next = { ...d, ...fields };
    onDraftChange({ ...fields, next_review_date: recalcNextReview(next) });
  };

  const isEditing = (key) => editingSection === key;
  const blockedFor = (key) => editBlocked && editingSection !== key;

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — Risk Identification */}
        <CardShell
          title="Risk Identification"
          editing={isEditing('identification')}
          onEdit={() => requestEdit('identification')}
          editDisabled={blockedFor('identification')}
          onCancel={closeEdit}
          onSave={() => onSaveKeys(['risk_id', 'title', 'description', 'category'])}
          saving={saving}>
          
          {isEditing('identification') ?
          <div className="space-y-3">
              <div>
                <EditLabel>Risk ID</EditLabel>
                <Input value={d.risk_id || ''} onChange={(e) => upd({ risk_id: e.target.value })} placeholder="RISK-001" aria-invalid={!!idError} className={idError ? 'border-destructive' : undefined} />
                {idError && <p className="text-xs text-destructive mt-1">{idError}</p>}
              </div>
              <div>
                <EditLabel>Risk Title</EditLabel>
                <Input value={d.title || ''} onChange={(e) => upd({ title: e.target.value })} placeholder="e.g. Loss of key funding" />
              </div>
              <div>
                <EditLabel>Risk Description</EditLabel>
                <Textarea rows={4} value={d.description || ''} onChange={(e) => upd({ description: e.target.value })} placeholder="Describe the risk" className="resize-none" />
              </div>
              <div>
                <EditLabel>Risk Category</EditLabel>
                <ColoredSelect
                value={d.category || ''}
                onChange={(v) => upd({ category: v })}
                options={catOpts}
                styleFor={categoryStyleFn(categoryOptions)}
                placeholder="Select..."
                allowClear />
              
              </div>
            </div> :

          <div className="space-y-4">
              <ReadField label="Risk ID">
                <span>{risk.risk_id}</span>
              </ReadField>
              <ReadField label="Risk Title">{risk.title}</ReadField>
              <ReadField label="Risk Description">{risk.description}</ReadField>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Risk Category</p>
                {risk.category ?
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${categoryStyleFn(categoryOptions)(risk.category)}`}>
                    {risk.category}
                  </span> :
              <span className="text-sm text-foreground">—</span>}
              </div>
            </div>
          }
        </CardShell>

        {/* RIGHT — Risk Details */}
        <CardShell
          title="Risk Details"
          editing={isEditing('details')}
          onEdit={() => requestEdit('details')}
          editDisabled={blockedFor('details')}
          onCancel={closeEdit}
          onSave={() => onSaveKeys(['status', 'risk_appetite', 'owner', 'raised_by', 'date_raised', 'review_frequency', 'interval_value', 'interval_unit', 'last_reviewed_date', 'next_review_date'])}
          saving={saving}>
          
          {isEditing('details') ?
          <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <EditLabel>Risk Status</EditLabel>
                  <ColoredSelect
                  value={d.status || ''}
                  onChange={(v) => upd(v === 'Closed' ?
                  { status: v, review_frequency: '', next_review_date: null, interval_value: '', interval_unit: '' } :
                  { status: v })}
                  options={statusOpts}
                  placeholder="Select..."
                  styleFor={getStatusStyle} />
                
                </div>
                <div>
                  <EditLabel>Risk Appetite</EditLabel>
                  <ColoredSelect
                  value={d.risk_appetite || ''}
                  onChange={(v) => upd({ risk_appetite: v })}
                  options={appetiteList}
                  placeholder="Select..."
                  styleFor={getAppetiteStyle}
                  allowClear />
                
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <EditLabel>Risk Owner</EditLabel>
                  <Input value={d.owner || ''} onChange={(e) => upd({ owner: e.target.value })} placeholder="Assign a risk owner" />
                </div>
                <div>
                  <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                    Raised By
                    <InfoTooltip text="Name the person who raised the risk." />
                  </Label>
                  <Input value={d.raised_by || ''} onChange={(e) => upd({ raised_by: e.target.value })} placeholder="e.g. Jane Doe / Finance" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                    Date Raised
                    <InfoTooltip text="Date when the risk was first raised." />
                  </Label>
                  <DateField value={d.date_raised || ''} onChange={(v) => upd({ date_raised: v })} />
                </div>
                <div>
                  <EditLabel>Review Frequency</EditLabel>
                  <Select value={d.review_frequency || ''} onValueChange={(v) => updReview({ review_frequency: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {REVIEW_FREQUENCIES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {d.review_frequency === 'Every' &&
            <div className="grid grid-cols-2 gap-3">
                  <div>
                    <EditLabel>Interval</EditLabel>
                    <Input
                  type="number"
                  min="1"
                  value={d.interval_value || ''}
                  onChange={(e) => updReview({ interval_value: e.target.value })}
                  placeholder="e.g. 4" />
                
                  </div>
                  <div>
                    <EditLabel>Unit</EditLabel>
                    <Select value={d.interval_unit || 'Months'} onValueChange={(v) => updReview({ interval_unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Months">Months</SelectItem>
                        <SelectItem value="Years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
            }
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <EditLabel>Last Review Date</EditLabel>
                  <DateField value={d.last_reviewed_date || ''} onChange={(v) => updReview({ last_reviewed_date: v })} />
                  <p className="text-[11px] text-muted-foreground mt-1">{NEXT_REVIEW_HELP}</p>
                </div>
                <div>
                  <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                    Next Review Date
                    <InfoTooltip text={NEXT_REVIEW_HELP} />
                  </Label>
                  <Input
                  type="text"
                  readOnly
                  value={d.next_review_date ? formatReviewDate(d.next_review_date) : '—'}
                  className="bg-muted/50 cursor-not-allowed" />
                
                  <p className="text-[11px] text-muted-foreground mt-1">Auto-calculated from frequency and last review date.</p>
                </div>
              </div>
            </div> :

          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Risk Status</p>
                  {risk.status ?
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(risk.status)}`}>
                      {risk.status}
                    </span> :
                <span className="text-sm text-foreground">—</span>}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Risk Appetite</p>
                  {risk.risk_appetite ?
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${getAppetiteStyle(risk.risk_appetite)}`}>
                      {risk.risk_appetite}
                    </span> :
                <span className="text-sm text-foreground">—</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ReadField label="Risk Owner">{risk.owner && <PersonName name={risk.owner} />}</ReadField>
                <ReadField label="Raised By" tooltip="Name the person who raised the risk.">{risk.raised_by && <PersonName name={risk.raised_by} />}</ReadField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ReadField label="Date Raised" icon={Calendar} tooltip="Date when the risk was first raised.">{risk.date_raised ? formatReviewDate(risk.date_raised) : ''}</ReadField>
                <ReadField label="Review Frequency">
                  {risk.review_frequency === 'Every' && risk.interval_value ?
                `Every ${risk.interval_value} ${risk.interval_unit || 'Months'}` :
                risk.review_frequency}
                </ReadField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ReadField label="Last Review Date" icon={Calendar}>{risk.last_reviewed_date ? formatReviewDate(risk.last_reviewed_date) : ''}</ReadField>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                    Next Review Date
                    <InfoTooltip text={NEXT_REVIEW_HELP} />
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <NextReviewDisplay date={risk.next_review_date} />
                  </div>
                </div>
              </div>
            </div>
          }
        </CardShell>
      </div>

      {/* Risk Analysis */}
      <div className="mt-4">
        <CardShell
          title="Risk Analysis"
          editing={isEditing('analysis')}
          onEdit={() => requestEdit('analysis')}
          editDisabled={blockedFor('analysis')}
          onCancel={closeEdit}
          onSave={() => onSaveKeys(['cause', 'impact'])}
          saving={saving}>
          
          {isEditing('analysis') ?
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <EditLabel>Risk Cause</EditLabel>
                <RichTextField value={d.cause || ''} onChange={(v) => upd({ cause: v })} placeholder="Describe the potential causes" minHeight={100} />
              </div>
              <div>
                <EditLabel>Risk Impact</EditLabel>
                <RichTextField value={d.impact || ''} onChange={(v) => upd({ impact: v })} placeholder="Describe the main impact" minHeight={100} />
              </div>
            </div> :

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Risk Cause</p>
                {risk.cause ?
              <div className="text-sm text-foreground [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4" dangerouslySetInnerHTML={{ __html: sanitizeRiskHtml(risk.cause) }} /> :
              <span className="text-sm text-foreground">—</span>}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Risk Impact</p>
                {risk.impact ?
              <div className="text-sm text-foreground [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4" dangerouslySetInnerHTML={{ __html: sanitizeRiskHtml(risk.impact) }} /> :
              <span className="text-sm text-foreground">—</span>}
              </div>
            </div>
          }
        </CardShell>
      </div>
    </div>);

}