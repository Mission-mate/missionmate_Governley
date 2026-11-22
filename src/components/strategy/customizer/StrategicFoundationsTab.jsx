import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { updateStrategy } from '@/lib/strategy';
import AutoGrowTextarea from '@/components/strategy/level5/tasks/detail/AutoGrowTextarea';
import ValuesInput, { VALUE_COLORS } from '@/components/strategy/ValuesInput';
import OutcomesEditor from '@/components/strategy/level3/OutcomesEditor';
import FoundationField from './FoundationField';

const FIELD = 'rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring';
const EMPTY = <p className="text-sm text-muted-foreground">—</p>;

const pick = (s) => ({
  vision: s?.vision || '',
  mission: s?.mission || '',
  values: s?.values || [],
  guiding_principles: s?.guiding_principles || []
});

/** Strategic Foundations — each field is viewed by default and saved independently. */
export default function StrategicFoundationsTab({ strategy, onSaved, onDirtyChange }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(() => pick(strategy));
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const dirty = !!editing && JSON.stringify(draft) !== JSON.stringify(saved[editing]);
  useEffect(() => { onDirtyChange(dirty); }, [dirty]);
  useEffect(() => () => onDirtyChange(false), []);

  const start = (key) => { setEditing(key); setDraft(saved[key]); };
  const cancel = () => { setEditing(null); setDraft(null); };
  const save = async () => {
    setSaving(true);
    try {
      await updateStrategy(strategy.id, { [editing]: draft });
      setSaved((prev) => ({ ...prev, [editing]: draft }));
      cancel();
      toast({ title: 'Strategic Foundations saved' });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, optional, view, editor) => (
    <FoundationField
      label={label}
      optional={optional}
      editing={editing === key}
      canEdit={!editing}
      saving={saving}
      onEdit={() => start(key)}
      onCancel={cancel}
      onSave={save}
      view={view}
    >
      {editor}
    </FoundationField>
  );

  const text = (v) => (v ? <p className="text-sm text-foreground whitespace-pre-wrap">{v}</p> : EMPTY);

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2">
      {field('vision', 'Vision', false, text(saved.vision),
        <AutoGrowTextarea value={draft || ''} onChange={setDraft} className={FIELD}
          placeholder="Forward-looking statement defining the future you want to create." />
      )}
      {field('mission', 'Mission', true, text(saved.mission),
        <AutoGrowTextarea value={draft || ''} onChange={setDraft} className={FIELD}
          placeholder="Define what you do today, whom you serve, and how your immediate actions move the organisation toward the vision." />
      )}
      {field('values', 'Values', true,
        saved.values.length ? (
          <div className="flex flex-wrap gap-1.5">
            {saved.values.map((v) => {
              const c = VALUE_COLORS.find((x) => x.id === v.color) || VALUE_COLORS[0];
              return <span key={v.id} className={cn('px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>{v.text}</span>;
            })}
          </div>
        ) : EMPTY,
        <ValuesInput values={draft || []} onChange={setDraft} />
      )}
      {field('guiding_principles', 'Guiding Principles', true,
        saved.guiding_principles.length ? (
          <ul className="space-y-1.5">
            {saved.guiding_principles.map((p) => (
              <li key={p.id} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />{p.text}
              </li>
            ))}
          </ul>
        ) : EMPTY,
        <OutcomesEditor outcomes={draft || []} onChange={setDraft} placeholder="e.g. Decisions are made closest to the community" />
      )}
    </div>
  );
}