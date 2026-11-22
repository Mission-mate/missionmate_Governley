import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useStrategies } from '@/hooks/useStrategies';
import { deleteStrategy } from '@/lib/strategy';
import StrategyCard from '@/components/strategy/StrategyCard';
import StrategyCapsuleTabs from '@/components/strategy/StrategyCapsuleTabs';
import StrategyCardCircleBar from '@/components/strategy/StrategyCardCircleBar';
import StrategyModal from '@/components/strategy/StrategyModal';
import DeleteStrategyDialog from '@/components/strategy/DeleteStrategyDialog';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';

const TABS = [{ id: 'active', label: 'Active' }, { id: 'archived', label: 'Archived' }];

export default function StrategyRegister() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { strategies, isLoading, refresh, ...read } = useStrategies();
  const [tab, setTab] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const leave = usePageLeaveGuard();

  const visible = useMemo(
    () => strategies.filter((s) => (tab === 'archived' ? s.status === 'Archived' : s.status !== 'Archived')),
    [strategies, tab]
  );
  const selected = visible.find((s) => s.id === selectedId) || null;

  const openNew = () => { setEditing(null); setModalOpen(true); };

  const handleMoveTo = async () => {
    const target = tab === 'archived' ? 'Active' : 'Archived';
    await base44.entities.Strategy.update(selected.id, { status: target });
    toast({ title: `${selected.title} ${target === 'Archived' ? 'archived' : 'restored to active'}` });
    setSelectedId(null);
    refresh();
  };

  const handleDelete = async () => {
    try {
      await deleteStrategy(deleting.id);
    } catch (e) {
      // The strategy is kept when cleanup fails, so the dialog stays open for a retry.
      toast({
        variant: 'destructive',
        title: `Couldn't delete ${deleting.title}`,
        description: `${e.message} Some related data may already be removed. Please try again.`,
      });
      refresh();
      return;
    }
    toast({ title: `${deleting.title} deleted` });
    setDeleting(null);
    setSelectedId(null);
    refresh();
  };

  return (
    <div className="p-6 w-fit max-w-full mx-auto">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Strategy Register</h1>
          <p className="text-sm text-muted-foreground mt-0.5">A structured index of every strategy in your organisation.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Create New Strategy
        </Button>
      </div>

      <div className="mb-6">
        <StrategyCapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: strategies.filter((s) => (t.id === 'archived' ? s.status === 'Archived' : s.status !== 'Archived')).length }))} value={tab} onChange={(t) => leave.guard(() => { setTab(t); setSelectedId(null); })} />
      </div>

      {isLoading ? (
        <ModuleLoader />
      ) : read.isLoadingError ? (
        <LoadError failure={read} title="Couldn’t load strategies" />
      ) : visible.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === 'archived' ? 'No archived strategies.' : 'No strategies yet. Create your first strategy to get started.'}
          </p>
        </div>
      ) : (
        <div className="content-enter grid grid-cols-1 sm:grid-cols-[repeat(2,360px)] lg:grid-cols-[repeat(3,360px)] gap-4">
          {visible.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              selected={selectedId === s.id}
              onSelect={(st) => setSelectedId((prev) => (prev === st.id ? null : st.id))}
              onView={(st) => navigate(`/strategy/register/${st.id}`)}
            />
          ))}
        </div>
      )}

      <StrategyCardCircleBar
        open={!!selected}
        activeTab={tab}
        onOpen={() => navigate(`/strategy/register/${selected.id}`)}
        onEdit={() => { setEditing(selected); setModalOpen(true); }}
        onMoveTo={handleMoveTo}
        onDelete={() => setDeleting(selected)}
        onClear={() => setSelectedId(null)}
      />

      <StrategyModal
        isOpen={modalOpen}
        strategy={editing}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
      />
      <DeleteStrategyDialog strategy={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
      {leave.dialog}
    </div>
  );
}