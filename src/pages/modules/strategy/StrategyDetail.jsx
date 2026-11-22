import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { Plus, SlidersHorizontal, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStrategy } from '@/hooks/useStrategy';
import { useLevel2 } from '@/hooks/useLevel2';
import { LAYER_SUBTITLES } from '@/lib/strategy';
import StrategyCapsuleTabs from '@/components/strategy/StrategyCapsuleTabs';
import StrategyOverviewTab from '@/components/strategy/StrategyOverviewTab';
import StrategyHierarchyModal from '@/components/strategy/customizer/StrategyHierarchyModal';
import StrategyFieldConfigPane from '@/components/strategy/customizer/StrategyFieldConfigPane';
import Level3Tab from '@/components/strategy/level3/Level3Tab';
import Level5Tab from '@/components/strategy/level5/Level5Tab';
import Level6Tab from '@/components/strategy/level6/Level6Tab';
import Level7Tab from '@/components/strategy/level7/Level7Tab';
import { getEnabledLayers, MODULES } from '@/lib/strategyLayers';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';

// The first two layers (Vision, Strategic Theme) live on the Overview tab.
const OVERVIEW_LAYERS = ['vision', 'theme'];

export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { strategy, blocks, isLoading, failure, refreshStrategy, refreshBlocks } = useStrategy(id);
  const { level2, refreshLevel2 } = useLevel2(id);
  // Deep-link support: ?tab=level<slot>&block=<id> (e.g. from the Overview) opens that row's pane.
  // Tab ids carry the layer's storage slot purely as an identifier.
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get('tab') || 'overview');
  const [initialOpenId, setInitialOpenId] = useState(urlParams.get('block') || null);

  // React to in-page deep links (Overview "Open" button navigates with new query params
  // without remounting this page) — switch tab and re-arm the block to auto-open.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const block = params.get('block');
    if (tab) setActiveTab(tab);
    setInitialOpenId(block || null);
  }, [location.search]);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [fieldConfigOpen, setFieldConfigOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  // Bumped when field config is saved — remounts the active workspace so any open
  // detail pane closes and can't re-save stale custom field values.
  const [configVersion, setConfigVersion] = useState(0);

  // Tabs reflect the strategy's own hierarchy — order, names and enabled flags.
  const workspaceLayers = useMemo(
    () => (strategy ? getEnabledLayers(strategy).filter((l) => !OVERVIEW_LAYERS.includes(l.key)) : []),
    [strategy]
  );

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      ...workspaceLayers.map((l) => ({ id: `level${l.level}`, label: l.name })),
    ],
    [workspaceLayers]
  );

  // If the active level gets disabled in the Customizer, fall back to Overview.
  useEffect(() => {
    if (strategy && !tabs.some((t) => t.id === activeTab)) setActiveTab('overview');
  }, [strategy, tabs, activeTab]);

  if (isLoading) {
    return <ModuleLoader fullPage />;
  }

  if (failure.isLoadingError) {
    return <LoadError page failure={failure} title="Couldn’t load this strategy" />;
  }

  if (!strategy) {
    return <div className="p-8 text-center text-muted-foreground">Strategy not found.</div>;
  }

  const isOverview = activeTab === 'overview';
  const activeLevel = isOverview ? null : Number(activeTab.replace('level', ''));
  const activeLayer = isOverview ? null : workspaceLayers.find((l) => l.level === activeLevel) || null;
  const layerKey = activeLayer?.key || null;
  const title = isOverview ? strategy.title : activeLayer?.name || '';
  const subtitle = LAYER_SUBTITLES[isOverview ? 'overview' : layerKey] || LAYER_SUBTITLES.overview;
  // Which workspace this layer renders with comes from the layer definition, never
  // from a hardcoded level number. Projects and Measures share the 'measures' module.
  const activeModule = activeLayer?.module;
  const isLevel3 = activeModule === MODULES.PRIORITIES;
  const isTaskLayer = activeModule === MODULES.ACTIONS;
  const isMeasures = activeModule === MODULES.MEASURES;
  const isEnablers = activeModule === MODULES.ENABLERS;

  return (
    <>
    {/* One shared workspace frame for every tab — no width shift when switching tabs or views. */}
    <div className="relative min-h-full">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden" aria-hidden="true">
      <img src="https://media.base44.com/images/public/6a1f6f3befc81ba358040823/08114a411_generated_49d64383.jpg" alt="" className="w-full h-full object-cover opacity-60 dark:opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
    </div>
    <div className="strategy-toolbars relative p-6 max-w-7xl mx-auto">
      <TopBarBack onClick={() => navigate('/strategy/register')}>Back to Strategy Register</TopBarBack>

      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {isOverview ? (
          <Button size="sm" className="h-9 gap-1.5 rounded-[10px] text-sm" onClick={() => setCustomizerOpen(true)}>
            <Network className="w-4 h-4" /> Strategy Hierarchy
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" data-toolbar-control="" className="gap-2" onClick={() => setFieldConfigOpen(true)}>
              <SlidersHorizontal className="w-4 h-4" /> Customise
            </Button>
            <Button className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" /> Add {title}
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <StrategyCapsuleTabs animated tabs={tabs} value={activeTab} onChange={(newTab) => { setActiveTab(newTab); setInitialOpenId(null); }} />
      </div>

      {isOverview ? (
        <StrategyOverviewTab strategy={strategy} blocks={blocks} onRefresh={refreshBlocks} />
      ) : isLevel3 ? (
        <Level3Tab
          key={`level3-${configVersion}`}
          strategy={strategy}
          initialOpenId={initialOpenId}
          blocks={blocks}
          level2Items={level2}
          addOpen={addOpen}
          onCloseAdd={() => setAddOpen(false)}
          onRefresh={refreshBlocks}
        />
      ) : isTaskLayer ? (
        <Level5Tab
          key={`${activeLevel}-${configVersion}`}
          strategy={strategy}
          level={activeLevel}
          initialOpenId={initialOpenId}
          blocks={blocks}
          addOpen={addOpen}
          onCloseAdd={() => setAddOpen(false)}
          onRefresh={refreshBlocks}
        />
      ) : isMeasures ? (
        <Level6Tab
          key={`${activeLevel}-${configVersion}`}
          strategy={strategy}
          level={activeLevel}
          blocks={blocks}
          addOpen={addOpen}
          onCloseAdd={() => setAddOpen(false)}
          onRefresh={refreshBlocks}
        />
      ) : isEnablers ? (
        <Level7Tab
          key={`${activeLevel}-${configVersion}`}
          strategy={strategy}
          level={activeLevel}
          initialOpenId={initialOpenId}
          blocks={blocks}
          addOpen={addOpen}
          onCloseAdd={() => setAddOpen(false)}
          onRefresh={refreshBlocks}
        />
      ) : null}

      {fieldConfigOpen && activeLevel && (
        <StrategyFieldConfigPane
          strategy={strategy}
          level={activeLevel}
          levelName={title}
          onClose={() => setFieldConfigOpen(false)}
          onSaved={async () => { setConfigVersion((v) => v + 1); await refreshStrategy(); }}
        />
      )}

      <StrategyHierarchyModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        strategy={strategy}
        level2={level2}
        blocks={blocks}
        onLevel2Changed={refreshLevel2}
        onSaved={refreshStrategy}
      />
    </div>
    </div>
    </>
  );
}