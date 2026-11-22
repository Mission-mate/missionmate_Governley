import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import FieldCard from '@/components/shared/customizer/FieldCard';
import ReadOnlyOptions from '@/components/shared/customizer/ReadOnlyOptions';
import { useFieldEdit } from '@/components/shared/customizer/fieldEditMode';
import InfoTooltip from '@/components/risk/InfoTooltip';
import FieldOptionRow from './FieldOptionRow';

/**
 * Optional system field with coloured options (Schedule, Resource, Budget, Risk).
 * The checkbox shows or hides it and saves at once; the pencil lets each option be
 * renamed and recoloured. Options can never be added or removed.
 */
export default function SystemSelectFieldCard({ def, field, savedField, onToggle, onChange }) {
  const { editing } = useFieldEdit(def.id);

  const setOption = (idx, opt) => onChange({ ...field, options: field.options.map((o, i) => (i === idx ? opt : o)) });

  // A blank name, or one another option already uses, goes back to the saved name.
  const restoreInvalidName = (idx) => {
    const name = field.options[idx].name.trim();
    const taken = field.options.some((o, i) => i !== idx && o.name.trim().toLowerCase() === name.toLowerCase());
    if (!name || taken) setOption(idx, { ...field.options[idx], name: savedField.options[idx].name });
  };

  return (
    <FieldCard
      id={def.id}
      title={def.title}
      locked
      leading={<Checkbox checked={field.table_visible} onCheckedChange={(v) => onToggle(!!v)} />}
      actions={<InfoTooltip text={def.tooltip} />}
    >
      {editing ? (
        field.options.map((opt, idx) => (
          <div key={idx} onBlur={() => restoreInvalidName(idx)}>
            <FieldOptionRow opt={opt} onChange={(v) => setOption(idx, v)} />
          </div>
        ))
      ) : (
        <ReadOnlyOptions options={field.options} colored />
      )}
    </FieldCard>
  );
}