import React, { useMemo, useRef } from 'react';
import ConflictOfInterestTab from '@/components/board/conflicts/ConflictOfInterestTab';
import { ConflictScopeContext } from '@/lib/conflictScope';
import { getAssetCustomColumns } from '@/lib/assetRegister';

/** The declarant's own slice of the shared Declarations Register — full editing, Open/Closed tabs, no summary cards. */
export default function DeclarantDeclarationsSection({ register, person }) {
  const headerRef = useRef(null);
  const scope = useMemo(() => ({
    registerId: register.id, personLabel: 'Person', title: `${register.title} — ${person.full_name}`,
    customColumns: getAssetCustomColumns(register),
    declarant: { user_id: person.id, name: person.full_name },
  }), [register, person.id, person.full_name]);

  return (
    <ConflictScopeContext.Provider value={scope}>
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Declarations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Record and track conflicts of interest declared by this person.</p>
          </div>
          <div ref={headerRef} />
        </div>
        <ConflictOfInterestTab headerSlotRef={headerRef} showSummary={false} />
      </section>
    </ConflictScopeContext.Provider>
  );
}