import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import GrantReportingTab from '@/components/grants/detail/GrantReportingTab';
import { ownerObligationsKey } from '@/lib/obligationSources';

/** Obligations tab for a Program or Project — the Grants obligations workspace on owner-only records. */
export default function OwnerObligationsTab({ source, owner, ownerName, providerName, obligations, isLoading, failure, currentUser }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ownerObligationsKey(source, owner.id) });

  return (
    <GrantReportingTab
      source={source}
      parentId={owner.id}
      exportParents={[{ id: owner.id, name: ownerName, provider: providerName }]}
      exportScope={ownerName}
      obligations={obligations}
      currentUser={currentUser}
      onRefresh={refresh}
      isLoading={isLoading}
      failure={failure}
    />
  );
}