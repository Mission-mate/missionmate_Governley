import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { levelEnabled } from '@/lib/strategy';
import { getLayerByKey, hierarchySorter } from '@/lib/strategyLayers';
import OverviewPriorityFilter from '@/components/strategy/overview/OverviewPriorityFilter';
import OverviewExportMenu from '@/components/strategy/overview/OverviewExportMenu';
import ExportStrategyOverviewDialog from '@/components/strategy/overview/ExportStrategyOverviewDialog';
import { exportOverviewExcel, exportOverviewPdf } from '@/lib/strategy/overviewExport';
import { levelLabel } from '@/lib/strategy';
import StrategyTreeRow, { TREE_GRID, TREE_GRID_NO_PRIORITY } from '@/components/strategy/overview/StrategyTreeRow';
import { overviewShowsPriority } from '@/lib/strategy/levelFields';
import OverviewDetailPane from '@/components/strategy/overview/OverviewDetailPane';
import OverviewLevelSummaryCards from '@/components/strategy/overview/OverviewLevelSummaryCards';
import SectionCard from '@/components/shared/SectionCard';
import StatusReportLauncher from '@/components/strategy/report/StatusReportLauncher';

/** Overview — hierarchical strategy tree built from Contributes To links. */
export default function StrategyOverviewTab({ strategy, blocks, onRefresh }) {
  const [search, setSearch] = useState('');
  const [viewBlockId, setViewBlockId] = useState(null);
  const [priorityId, setPriorityId] = useState(null);
  const q = search.trim().toLowerCase();

  // Priority column is pointless when every table level has it switched off.
  const showPrio = overviewShowsPriority(strategy);
  const priorityLayer = getLayerByKey(strategy, 'priorities');
  // Rows follow the strategy's own hierarchy order, not the numeric storage slots.
  const sortBlocks = useMemo(() => hierarchySorter(strategy), [strategy]);
  const priorities = useMemo(
    () => blocks.filter((b) => b.level === priorityLayer?.level).sort(sortBlocks),
    [blocks, priorityLayer, sortBlocks]
  );
  const selectedPriority = priorityId ? priorities.find((p) => p.id === priorityId) || null : null;

  const { roots: allRoots, childrenMap } = useMemo(() => {
    const enabled = blocks.filter((b) => levelEnabled(strategy, b.level));
    const ids = new Set(enabled.map((b) => b.id));
    const map = {};
    const roots = [];
    enabled.forEach((b) => {
      const parentId = b.contributes_to;
      if (parentId && ids.has(parentId)) {
        (map[parentId] = map[parentId] || []).push(b);
      } else {
        roots.push(b);
      }
    });
    Object.values(map).forEach((arr) => arr.sort(sortBlocks));
    roots.sort(sortBlocks);
    return { roots, childrenMap: map };
  }, [blocks, strategy]);

  // Priority filter — restrict the tree (and search) to the selected Priority and its descendants.
  const { roots, scopedBlocks } = useMemo(() => {
    if (!selectedPriority) return { roots: allRoots, scopedBlocks: blocks };
    const collected = [selectedPriority];
    const walk = (id) => (childrenMap[id] || []).forEach((c) => { collected.push(c); walk(c.id); });
    walk(selectedPriority.id);
    return { roots: [selectedPriority], scopedBlocks: collected };
  }, [selectedPriority, allRoots, blocks, childrenMap]);

  // When searching, show each match with its full ancestor chain (ancestors dimmed as context).
  const searchResults = useMemo(() => {
    if (!q) return null;
    const enabled = scopedBlocks.filter((b) => levelEnabled(strategy, b.level));
    const byId = new Map(enabled.map((b) => [b.id, b]));
    const matches = enabled.filter(
      (b) => b.title.toLowerCase().includes(q) || (b.custom_id || '').toLowerCase().includes(q) || (b.owner || '').toLowerCase().includes(q)
    );
    const matchedIds = new Set(matches.map((b) => b.id));
    const map = {};
    const rootIds = new Set();
    matches.forEach((m) => {
      // Walk up the contributes_to chain, registering each node as its parent's only path-child.
      let node = m;
      const seen = new Set([m.id]);
      for (;;) {
        const parentId = node.contributes_to;
        const parent = parentId ? byId.get(parentId) : null;
        if (!parent || seen.has(parent.id)) {
          rootIds.add(node.id);
          break;
        }
        seen.add(parent.id);
        const arr = (map[parent.id] = map[parent.id] || []);
        if (!arr.some((c) => c.id === node.id)) arr.push(node);
        node = parent;
      }
    });
    Object.values(map).forEach((arr) => arr.sort(sortBlocks));
    const roots = [...rootIds].map((id) => byId.get(id)).filter(Boolean).sort(sortBlocks);
    return { roots, childrenMap: map, matchedIds };
  }, [q, scopedBlocks, strategy]);

  const rows = searchResults ? searchResults.roots : roots;
  const [exportFormat, setExportFormat] = useState(null);

  const handleExport = (status, health) => {
    const map = searchResults ? searchResults.childrenMap : childrenMap;
    const flat = [];
    const walk = (node, depth) => {
      flat.push({
        title: node.title,
        custom_id: node.custom_id,
        levelLabel: levelLabel(strategy, node.level),
        owner: node.owner,
        health: node.health,
        status: node.status,
        priority: node.priority,
        depth,
      });
      (map[node.id] || []).forEach((c) => walk(c, depth + 1));
    };
    rows.forEach((r) => walk(r, 0));

    const matchHealth = (h) => health === 'All' || h === health || (health === 'At Risk' && h === 'Monitor');
    const filtered = flat.filter((i) => (status === 'All' || i.status === status) && matchHealth(i.health));

    const title = `${strategy.title || 'Strategy'} - Overview`;
    if (exportFormat === 'excel') exportOverviewExcel(filtered, title, { showPriority: showPrio });
    else exportOverviewPdf(filtered, title, [], { showPriority: showPrio });
    setExportFormat(null);
  };

  return (
    <div>
      <OverviewLevelSummaryCards strategy={strategy} blocks={blocks} />

      <div className="flex items-center justify-end gap-2 flex-wrap mb-4">
        <div className="relative w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-toolbar-control=""
            className="pl-9 h-9 rounded-[10px]"
          />
        </div>
        <StatusReportLauncher strategy={strategy} />
        {showPrio && priorities.length > 0 && (
          <OverviewPriorityFilter
            label={priorityLayer?.name || 'Priority'}
            priorities={priorities}
            value={priorityId}
            onChange={setPriorityId}
          />
        )}
        <OverviewExportMenu onExport={setExportFormat} />
      </div>

      {(
        <>
          <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
            <div className={cn(showPrio ? TREE_GRID : TREE_GRID_NO_PRIORITY, 'py-2.5 bg-secondary/40 border-b border-border text-xs font-semibold text-foreground/80 uppercase tracking-wide items-center')}>
              <span>Strategic Item</span>
              <span>Health</span>
              <span>Status</span>
              {showPrio && <span>Priority</span>}
            </div>
            {rows.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">
                {q ? 'No records match your search.' : 'No strategic items yet. Use the level tabs to start building this strategy.'}
              </div>
            ) : (
              rows.map((b, i) => (
                <StrategyTreeRow
                  key={b.id}
                  node={b}
                  depth={0}
                  index={i}
                  strategy={strategy}
                  childrenMap={searchResults ? searchResults.childrenMap : childrenMap}
                  matchedIds={searchResults ? searchResults.matchedIds : null}
                  showPriority={showPrio}
                  onSelect={(node) => setViewBlockId(node.id)}
                />
              ))
            )}
          </div>

          {strategy.description && (
            <SectionCard title="About this strategy" className="mt-4 border border-border">
              <p className="text-sm text-foreground leading-relaxed">{strategy.description}</p>
            </SectionCard>
          )}
        </>
      )}

      <ExportStrategyOverviewDialog
        isOpen={!!exportFormat}
        format={exportFormat === 'excel' ? 'excel' : 'pdf'}
        onClose={() => setExportFormat(null)}
        onConfirm={handleExport}
      />

      {/* Same per-level detail pane as the level tabs — one component, always in sync */}
      <OverviewDetailPane
        block={viewBlockId ? blocks.find((b) => b.id === viewBlockId) || null : null}
        strategy={strategy}
        blocks={blocks}
        onClose={() => setViewBlockId(null)}
        onSaved={() => onRefresh?.()}
      />
    </div>
  );
}