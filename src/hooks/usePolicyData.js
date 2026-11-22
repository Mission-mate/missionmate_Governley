import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listPolicies, getPolicyConfig, policyCategoryStore } from '@/lib/policies';
import { loadFailure } from '@/lib/readState';

/** Policy documents, categories, document types and custom columns, plus a shared refresh. */
export default function usePolicyData() {
  const qc = useQueryClient();
  const docsQ = useQuery({ queryKey: ['policyDocuments'], queryFn: listPolicies });
  const catsQ = useQuery({ queryKey: ['policyCategories'], queryFn: policyCategoryStore.getCategories });
  const configQ = useQuery({ queryKey: ['policyConfig'], queryFn: getPolicyConfig });
  const refresh = () => Promise.all(['policyDocuments', 'policyCategories', 'policyConfig'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
  return {
    docs: docsQ.data || [], categories: catsQ.data || [],
    types: configQ.data?.types || [], columns: configQ.data?.columns || [],
    isLoading: docsQ.isLoading || catsQ.isLoading || configQ.isLoading, refresh,
    failure: loadFailure(docsQ, catsQ, configQ),
  };
}