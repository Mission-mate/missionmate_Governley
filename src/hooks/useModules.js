import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppConfig, saveAppConfig } from '@/lib/appConfig';
import { MODULES_KEY, ALL_MODULE_IDS, PINNED_MODULE_IDS } from '@/lib/modules';
import { toast } from '@/components/ui/use-toast';

/**
 * Merge a saved order with the canonical module id list.
 * Pinned modules always lead; the rest keep only valid ids, in saved order,
 * followed by any new modules that aren't in the saved order yet.
 */
function resolveOrder(savedOrder) {
  const movable = ALL_MODULE_IDS.filter((id) => !PINNED_MODULE_IDS.includes(id));
  const valid = (savedOrder || []).filter((id) => movable.includes(id));
  const missing = movable.filter((id) => !valid.includes(id));
  return [...PINNED_MODULE_IDS, ...valid, ...missing];
}

/**
 * Enabled module ids from the saved settings. A module added after the settings
 * were last saved (absent from the saved order) starts enabled.
 */
function resolveEnabled(settings) {
  const saved = settings?.enabled_modules;
  if (!saved) return ALL_MODULE_IDS;
  const known = settings.module_order;
  if (!known) return saved;
  return [...saved, ...ALL_MODULE_IDS.filter((id) => !known.includes(id) && !saved.includes(id))];
}

/**
 * Returns enabled module ids, their display order, and mutations to
 * toggle active state and reorder modules.
 * Defaults to all modules enabled and canonical order when no config exists.
 */
export function useModules() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['app-modules'],
    queryFn: async () => {
      const record = await getAppConfig(MODULES_KEY);
      return {
        record,
        enabled: resolveEnabled(record?.settings),
        order: resolveOrder(record?.settings?.module_order),
      };
    },
  });

  const enabledModules = data?.enabled ?? ALL_MODULE_IDS;
  const moduleOrder = data?.order ?? resolveOrder();

  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      const current = enabledModules;
      const next = current.includes(id)
        ? current.filter(m => m !== id)
        : [...current, id];
      await saveAppConfig(MODULES_KEY, { enabled_modules: next, module_order: moduleOrder }, data?.record);
      return next;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['app-modules'] });
      const prev = queryClient.getQueryData(['app-modules']);
      queryClient.setQueryData(['app-modules'], (old) => {
        const current = old?.enabled ?? ALL_MODULE_IDS;
        const next = current.includes(id)
          ? current.filter((m) => m !== id)
          : [...current, id];
        return old ? { ...old, enabled: next } : old;
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['app-modules'], ctx.prev);
      toast({
        title: "Couldn't update module",
        description: 'The change was not saved. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['app-modules'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (nextOrder) => {
      const clean = resolveOrder(nextOrder);
      await saveAppConfig(MODULES_KEY, { enabled_modules: enabledModules, module_order: clean }, data?.record);
      return clean;
    },
    onMutate: async (nextOrder) => {
      await queryClient.cancelQueries({ queryKey: ['app-modules'] });
      const prev = queryClient.getQueryData(['app-modules']);
      queryClient.setQueryData(['app-modules'], (old) =>
        old ? { ...old, order: resolveOrder(nextOrder) } : old
      );
      return { prev };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['app-modules'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['app-modules'] });
    },
  });

  return {
    enabledModules,
    moduleOrder,
    isLoading,
    isModuleActive: (id) => enabledModules.includes(id),
    toggleModule: toggleMutation.mutateAsync,
    reorderModules: reorderMutation.mutate,
  };
}