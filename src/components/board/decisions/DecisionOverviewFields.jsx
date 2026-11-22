import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import SectionCard from '@/components/shared/SectionCard';
import ColoredSelect from '@/components/shared/ColoredSelect';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import MeetingSearch from '@/components/board/meeting-actions/MeetingSearch';
import { FieldLabel, ViewValue } from '@/components/board/registers/paneFields';
import DecisionTypeChoice from '@/components/board/decisions/DecisionTypeChoice';
import EarlierDecisionSearch from '@/components/board/decisions/EarlierDecisionSearch';
import { OutcomeBadge } from '@/components/board/decisions/DecisionBadges';
import { formatDate } from '@/lib/meetingActionApi';
import { OUTCOME_OPTIONS, DISPOSITION_OPTIONS, decisionStatus } from '@/lib/decisions';
import { cn } from '@/lib/utils';

const VOTE_FIELDS = [
  { key: 'votes_for', label: 'For' },
  { key: 'votes_against', label: 'Against' },
  { key: 'votes_abstained', label: 'Abstained' },
];
const INVALID = 'border-destructive focus-visible:ring-destructive';

/**
 * Overview tab of the decision pane: the type choice, Decision Details, Motion & Vote
 * (resolutions only) and the earlier-decision question.
 * candidates: the other decisions in the register; replacedBy: decisions that supersede or rescind this one.
 */
export default function DecisionOverviewFields({ form, set, setMeeting, errors, viewMode, candidates, replacedBy }) {
  const navigate = useNavigate();
  const earlier = candidates.find((d) => d.id === form.earlier_decision_id);
  const text = (key, placeholder, invalid) => (
    <Input
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
      placeholder={placeholder}
      className={cn('bg-white', invalid && INVALID)}
    />
  );

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required={!viewMode}>Decision Type</FieldLabel>
        {viewMode
          ? <ViewValue value={form.decision_type} />
          : <DecisionTypeChoice value={form.decision_type} onChange={(v) => set('decision_type', v)} />}
      </div>

      <SectionCard title="Decision Details">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="col-span-2">
            <FieldLabel required={!viewMode} error={errors.title}>Decision Title</FieldLabel>
            {viewMode ? <ViewValue value={form.title} /> : text('title', 'e.g. Approve the 2028 operational budget', errors.title)}
            {errors.title && <p className="mt-1 text-xs text-destructive">Decision Title is required.</p>}
          </div>
          <div className="col-span-2">
            <FieldLabel>Decision as minuted</FieldLabel>
            {viewMode
              ? <ViewValue value={form.minuted_text} multiline />
              : <AutoGrowTextarea
                  value={form.minuted_text}
                  onChange={(e) => set('minuted_text', e.target.value)}
                  placeholder="Record the decision as it appears in the minutes."
                  className="min-h-[72px]" />}
          </div>
          <div className="min-w-0">
            <FieldLabel>Meeting Title</FieldLabel>
            {viewMode ? (
              <div className="flex items-start justify-between gap-2">
                <ViewValue value={form.meeting_name} />
                {form.meeting_id && form.meeting_name && (
                  <button
                    type="button"
                    onClick={() => navigate(`/board/meetings/${form.meeting_id}`)}
                    title="Open meeting"
                    className="-mt-1 w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-[background-color,color] duration-[120ms]">
                    <ExternalLink className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                )}
              </div>
            ) : (
              <MeetingSearch value={{ id: form.meeting_id, title: form.meeting_name }} onChange={setMeeting} />
            )}
          </div>
          <div>
            <FieldLabel>Meeting Date</FieldLabel>
            {viewMode
              ? <ViewValue value={form.meeting_date ? formatDate(form.meeting_date) : ''} />
              : <Input value={form.meeting_date ? formatDate(form.meeting_date) : ''} disabled readOnly placeholder="Filled from the meeting" className="bg-white" />}
          </div>
          <div className="col-span-2">
            <FieldLabel>Outcome</FieldLabel>
            {viewMode
              ? <OutcomeBadge outcome={form.outcome} />
              : <ColoredSelect value={form.outcome} onChange={(v) => set('outcome', v)} options={OUTCOME_OPTIONS} />}
          </div>
          <div>
            <FieldLabel>Agenda Item</FieldLabel>
            {viewMode ? <ViewValue value={form.agenda_item} /> : text('agenda_item', 'e.g., 5.1')}
          </div>
          <div>
            <FieldLabel>Decision Date</FieldLabel>
            {viewMode
              ? <ViewValue value={form.decision_date ? formatDate(form.decision_date) : ''} />
              : <DateField value={form.decision_date} onChange={(v) => set('decision_date', v)} inputClassName="bg-white" />}
          </div>
        </div>
      </SectionCard>

      {form.decision_type === 'Resolution' && (
        <SectionCard title="Motion & Vote">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <FieldLabel>Mover</FieldLabel>
              {viewMode ? <ViewValue value={form.mover} /> : text('mover', 'Name of the mover')}
            </div>
            <div>
              <FieldLabel>Seconder</FieldLabel>
              {viewMode ? <ViewValue value={form.seconder} /> : text('seconder', 'Name of the seconder')}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-x-4 mt-4">
            {VOTE_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <FieldLabel error={errors[key]}>{label}</FieldLabel>
                {viewMode ? <ViewValue value={form[key]} /> : (
                  <Input
                    type="number" min="0" step="1" inputMode="numeric"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder="0"
                    className={cn('bg-white', errors[key] && INVALID)} />
                )}
                {errors[key] && <p className="mt-1 text-xs text-destructive">Enter a whole number.</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard>
        <FieldLabel required={!viewMode}>Replaces an earlier decision?</FieldLabel>
        {viewMode
          ? <ViewValue value={form.disposition} />
          : <ColoredSelect value={form.disposition} onChange={(v) => set('disposition', v)} options={DISPOSITION_OPTIONS} allowClear={false} />}
        {form.disposition !== 'No' && (
          <div className="mt-4">
            <FieldLabel required={!viewMode} error={errors.earlier_decision_id}>Earlier decision</FieldLabel>
            {viewMode
              ? <ViewValue value={earlier?.title} />
              : <EarlierDecisionSearch
                  value={form.earlier_decision_id}
                  decisions={candidates}
                  onChange={(id) => set('earlier_decision_id', id)}
                  invalid={errors.earlier_decision_id} />}
            {errors.earlier_decision_id && (
              <p className="mt-1 text-xs text-destructive">Select the earlier decision this one {form.disposition === 'Rescinds' ? 'rescinds' : 'supersedes'}.</p>
            )}
          </div>
        )}
        {viewMode && replacedBy.length > 0 && (
          <div className="mt-4">
            <FieldLabel>Replaced by</FieldLabel>
            {replacedBy.map((d) => (
              <p key={d.id} className="text-sm text-foreground">
                <span className="text-muted-foreground">{decisionStatus(d)} by:</span> {d.title}
              </p>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}