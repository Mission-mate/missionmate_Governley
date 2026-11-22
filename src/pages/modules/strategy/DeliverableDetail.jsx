import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { base44 } from '@/api/base44Client';
import { LoaderOne } from '@/components/ui/loaders';
import HealthHeaderBadge from '@/components/strategy/connections/HealthHeaderBadge';
import ReportViewSwitcher from '@/components/strategy/level6/report/ReportViewSwitcher';
import Level6ReportPanel from '@/components/strategy/level6/report/Level6ReportPanel';
import DeliverableLoadError from '@/components/strategy/level6/detail/DeliverableLoadError';
import DeliverableOverview from '@/components/strategy/level6/detail/DeliverableOverview';
import { level6PaneTabs } from '@/components/strategy/level6/paneTabs';
import TaskHeaderActions from '@/components/strategy/level5/tasks/TaskHeaderActions';
import NotesTab from '@/components/notes/NotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import { levelLabel } from '@/lib/strategy';

/** Dedicated deliverable (Level 6) page — Overview, Completion, Data and Chart. */
export default function DeliverableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [blocks, setBlocks] = useState([]);
  // null while loading or loaded; 'not_found' or 'failed' once a load settles without data.
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'overview');
  const [currentUser, setCurrentUser] = useState(null);
  const [taskControls, setTaskControls] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  // A retry keeps the error card on screen until a load succeeds, so its retry count survives.
  const load = useCallback(async () => {
    try {
      const block = await base44.entities.StrategyBlock.get(id);
      if (!block) return setLoadError('not_found');
      const [strat, all] = await Promise.all([
        base44.entities.Strategy.get(block.strategy_id),
        base44.entities.StrategyBlock.filter({ strategy_id: block.strategy_id }, 'order_index'),
      ]);
      if (!strat) return setLoadError('not_found');
      setItem(block);
      setStrategy(strat);
      setBlocks(all);
      setLoadError(null);
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      setLoadError(status === 404 ? 'not_found' : 'failed');
    }
  }, [id]);

  useEffect(() => { setLoadError(null); load(); }, [load]);

  const counts = useRecordTabCounts('strategy_deliverable', id, { tasks: 'level5' });
  const tabs = useMemo(() => {
    if (!item) return [];
    const countFor = { completion: counts.tasks, notes: counts.notes, documents: counts.documents };
    return level6PaneTabs(item, true).map((t) => ({ ...t, count: countFor[t.key] }));
  }, [item, counts.tasks, counts.notes, counts.documents]);
  useEffect(() => {
    if (tabs.length && !tabs.some((t) => t.key === tab)) setTab('overview');
  }, [tabs, tab]);

  if (loadError) {
    return <DeliverableLoadError notFound={loadError === 'not_found'} onRetry={load} />;
  }

  if (!item || !strategy) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderOne size="lg" />
      </div>
    );
  }

  return (
    <div className="strategy-toolbars p-6 max-w-7xl mx-auto space-y-6 font-body">
      <div className="min-w-0">
        <TopBarBack onClick={() => navigate(`/strategy/register/${strategy.id}?tab=level${item.level}`)}>Back to {levelLabel(strategy, item.level)}</TopBarBack>
        <h1 className="text-2xl font-bold text-foreground truncate">{item.title}</h1>
        <div className="mt-1.5"><HealthHeaderBadge health={item.health || ''} /></div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {tabs.length > 1 ? <ReportViewSwitcher animated view={tab} onChange={setTab} tabs={tabs} /> : <div />}
        {tab === 'completion' && taskControls && (
          <TaskHeaderActions onAdd={taskControls.addTask} onManageColumns={taskControls.manageColumns} />
        )}
      </div>

      {tab === 'overview' &&
        <DeliverableOverview item={item} strategy={strategy} blocks={blocks} onSaved={load} />
      }
      {tab === 'notes' &&
        <NotesTab objectType="strategy_deliverable" objectId={item.id} currentUser={currentUser} />
      }
      {tab === 'documents' &&
        <DocumentsTab objectType="strategy_deliverable" objectId={item.id} currentUser={currentUser} />
      }
      {!['overview', 'notes', 'documents'].includes(tab) &&
        <Level6ReportPanel block={item} view={tab} onViewChange={setTab} showSwitcher={false} readOnly={false} onTaskControls={setTaskControls} />
      }
    </div>
  );
}