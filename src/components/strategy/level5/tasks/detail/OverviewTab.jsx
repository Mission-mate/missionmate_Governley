import React from 'react';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import { cn } from '@/lib/utils';
import { CustomCellEditor } from '@/components/strategy/level6/report/ReportCellEditor';
import OptionSelectField from './OptionSelectField';
import { isDottedColumn } from '@/components/shared/OptionLabel';
import AutoGrowTextarea from './AutoGrowTextarea';
import ProgressBar from '@/components/risk/ProgressBar';
import InfoTooltip from '@/components/risk/InfoTooltip';
import TaskCellDisplay from '../TaskCellDisplay';
import SectionCard from '@/components/shared/SectionCard';
import DescriptionBlock from './DescriptionBlock';

/** Plain read-only value line used when the pane is view-only. */
function ReadText({ value, multiline = false }) {
  if (!value && value !== 0) return <p className="text-sm text-muted-foreground/50">—</p>;
  return <p className={cn('text-sm text-foreground', multiline && 'whitespace-pre-wrap')}>{value}</p>;
}

// Column types that need a full-width row (for longer text visibility).
const FULL_WIDTH_TYPES = ['Text/Number', 'Long Text'];

function FieldLabel({ children, required = false, tooltip = '' }) {
  return (
    <p className="mb-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
      {children}
      {required && <span className="text-destructive">*</span>}
      {tooltip && <InfoTooltip text={tooltip} />}
    </p>
  );
}

// Fixed ordering for the first built-in fields in the details grid.
const FIELD_ORDER = ['start_date', 'due_date', 'owner', 'health'];
const TOOLTIPS = { start_date: 'Expected Start Date', due_date: 'Target Due Date' };

const WHITE_INPUT = 'bg-white';
export const SECTION_TOOLTIP = 'Section helps group related tasks into buckets';

function BuiltinEditor({ column, value, onChange }) {
  if (column.type === 'Date') return <DateField value={value || ''} onChange={onChange} placeholder="DD MMM YYYY" inputClassName="bg-white" />;
  if (column.type === 'Single Select') {
    return <OptionSelectField options={column.options} value={value} onChange={onChange} dotted={isDottedColumn(column)} />;
  }
  const placeholder = column.key === 'owner' ? 'e.g. Project Manager' : '—';
  return <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={WHITE_INPUT} />;
}

/** Overview tab for the task detail pane — clean white fields, always-open sections. */
export default function OverviewTab({ form, columns, onSet, onSetCustom, kindLabel = 'Task', idError = '', titleOnly = false, dateErrors = {}, readOnly = false }) {
  if (titleOnly) {
    return (
      <SectionCard>
        <FieldLabel tooltip={SECTION_TOOLTIP}>{kindLabel} Title</FieldLabel>
        {readOnly ? <ReadText value={form.title} multiline /> : (
          <AutoGrowTextarea
            value={form.title}
            onChange={onSet('title')}
            placeholder="e.g. Planning and Co-design"
            className="rounded-md border border-input bg-white px-3 py-2 text-sm break-words focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
          />
        )}
        <DescriptionBlock value={form.description} onChange={onSet('description')} readOnly={readOnly} />
      </SectionCard>
    );
  }
  // Progress % lives in its own wrapper below the details grid.
  const progressColumn = columns.find((c) => c.type === 'Progress');
  const rank = (c) => {
    const i = c.kind === 'custom' ? -1 : FIELD_ORDER.indexOf(c.key);
    return i === -1 ? FIELD_ORDER.length : i;
  };
  const detailColumns = columns
    .filter((c) => c.type !== 'Progress')
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i)
    .map(({ c }) => c);

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="mb-4">
          <FieldLabel>{kindLabel} ID</FieldLabel>
          {readOnly ? <ReadText value={form.custom_id} /> : (
            <>
              <Input
                value={form.custom_id || ''}
                onChange={(e) => onSet('custom_id')(e.target.value)}
                placeholder={kindLabel === 'Milestone' ? 'e.g. MIL-001' : 'e.g. TSK-001'}
                className={cn(WHITE_INPUT, idError && 'border-destructive')}
              />
              {idError && <p className="mt-1 text-xs text-destructive">{idError}</p>}
            </>
          )}
        </div>
        <div>
          <FieldLabel required={!readOnly}>{kindLabel} Title</FieldLabel>
          {readOnly ? <ReadText value={form.title} multiline /> : (
            <AutoGrowTextarea
              value={form.title}
              onChange={onSet('title')}
              placeholder={kindLabel === 'Milestone' ? 'e.g. Program logic co-designed with stakeholders' : 'e.g. Draft program logic for stakeholder feedback'}
              className="rounded-md border border-input bg-white px-3 py-2 text-sm break-words focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          )}
        </div>
        <DescriptionBlock value={form.description} onChange={onSet('description')} readOnly={readOnly} />
      </SectionCard>

      <SectionCard title={`${kindLabel} Details`}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {detailColumns.map((col) => {
            if (col.kind === 'custom') {
              const fullWidth = FULL_WIDTH_TYPES.includes(col.type);
              return (
                <div key={col.id} className={cn(fullWidth && 'col-span-2')}>
                  <FieldLabel>{col.title}</FieldLabel>
                  {readOnly
                    ? <ReadText value={form.custom_values[col.id]} />
                    : <CustomCellEditor column={col} value={form.custom_values[col.id]} onChange={onSetCustom(col.id)} />}
                </div>
              );
            }
            const isDate = col.key === 'start_date' || col.key === 'due_date';
            return (
              <div key={col.key}>
                <FieldLabel required={isDate && !readOnly} tooltip={TOOLTIPS[col.key] || ''}>{col.label}</FieldLabel>
                {readOnly
                  ? <div className="text-sm"><TaskCellDisplay column={col} task={form} /></div>
                  : <BuiltinEditor column={col} value={form[col.key]} onChange={onSet(col.key)} />}
                {!readOnly && isDate && dateErrors[col.key] && (
                  <p className="mt-1 text-xs text-destructive">{dateErrors[col.key]}</p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {progressColumn && (
        <SectionCard>
          <FieldLabel>{`${progressColumn.label} — ${Number(form.progress) || 0}%`}</FieldLabel>
          <ProgressBar
            value={Number(form.progress) || 0}
            size="md"
            showLabel={false}
            editable={!readOnly}
            onChange={onSet('progress')}
          />
        </SectionCard>
      )}
    </div>
  );
}