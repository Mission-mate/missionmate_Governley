import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GrantReportingTab from '@/components/grants/detail/GrantReportingTab';
import { CONTRACT_OBLIGATIONS, contractObligationsKey } from '@/lib/obligationSources';

/** Contract Obligations tab — the Grants obligations workspace scoped to one contract. */
export default function ContractObligationsTab({ contract, currentUser }) {
  const qc = useQueryClient();
  const key = contractObligationsKey(contract.id);
  const { data: obligations = [], isLoading, ...read } = useQuery({
    queryKey: key,
    queryFn: () => base44.entities.ContractObligation.filter({ contract_id: contract.id }, '-created_date', 1000),
  });
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: key }),
    qc.invalidateQueries({ queryKey: [...key, 'count'] }),
  ]);

  return (
    <GrantReportingTab
      source={CONTRACT_OBLIGATIONS}
      parentId={contract.id}
      parentExtra={{ register_id: contract.register_id }}
      exportParents={[{ id: contract.id, name: contract.title, provider: contract.party_name }]}
      exportScope={contract.title}
      obligations={obligations}
      currentUser={currentUser}
      onRefresh={refresh}
      isLoading={isLoading}
      failure={read}
    />
  );
}