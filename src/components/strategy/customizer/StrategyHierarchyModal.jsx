import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import MotionModal from '@/components/shared/MotionModal';
import DiscardChangesDialog from '@/components/shared/DiscardChangesDialog';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import StrategyCapsuleTabs from '@/components/strategy/StrategyCapsuleTabs';
import ManageLevel2Panel from '@/components/strategy/level2/ManageLevel2Panel';
import { updateStrategy } from '@/lib/strategy';
import { getLayers, serializeLayers } from '@/lib/strategyLayers';
import LayerConfigRow from './LayerConfigRow';
import HierarchyPreview from './HierarchyPreview';
import StrategicFoundationsTab from './StrategicFoundationsTab';

const TAB_GUIDES = {
  hierarchy: "Customize the terminology and order to match your organization's strategy framework",
  foundations: 'Define the organisation’s vision, mission and values',
  theme: 'Manage the areas of focus that groups the strategy'
};

/** Customizer — hierarchy layers, strategic foundations and strategic themes. */
export default function StrategyHierarchyModal({
  isOpen,
  onClose,
  strategy,
  level2 = [],
  blocks = [],
  onLevel2Changed,
  onSaved
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState('hierarchy');
  const [layers, setLayers] = useState([]);
  const [baseline, setBaseline] = useState([]);
  const [subDirty, setSubDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reset only when the customizer opens — per-field saves refresh `strategy` mid-session.
  useEffect(() => {
    if (isOpen && strategy) {
      const snap = getLayers(strategy);
      setTab('hierarchy');
      setLayers(snap);
      setBaseline(snap);
      setSubDirty(false);
    }
  }, [isOpen, strategy?.id]);

  const layersDirty = JSON.stringify(layers) !== JSON.stringify(baseline);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { layers, subDirty }, baseline: { layers: baseline, subDirty: false },
    onClose, saving, enabled: isOpen && !!strategy,
    subject: 'strategy settings changes'
  });

  const themeLayer = layers.find((l) => l.key === 'theme');
  const themeEnabled = !!themeLayer?.enabled;
  const themeName = themeLayer?.name || 'Strategic Theme';

  const tabs = useMemo(
    () => [
    { id: 'hierarchy', label: 'Strategy Hierarchy' },
    { id: 'foundations', label: 'Strategic Foundations' },
    ...(themeEnabled ? [{ id: 'theme', label: 'Strategic Themes' }] : [])],
    [themeEnabled]
  );

  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab('hierarchy');
  }, [tabs, tab]);

  const changeTab = (next) => {
    if (next === tab) return;
    const dirty = tab === 'hierarchy' ? layersDirty : subDirty;
    if (dirty) setPendingTab(next);else setTab(next);
  };

  const confirmTabSwitch = () => {
    if (tab === 'hierarchy') setLayers(baseline);
    setTab(pendingTab);
    setPendingTab(null);
  };

  const patch = (key, changes) =>
  setLayers((prev) => prev.map((l) => l.key === key ? { ...l, ...changes } : l));

  // The Custom layer sits below Enablers by default, so it may hop over Enablers
  // when reordered — all other layers can only swap with reorderable neighbours.
  const canSwap = (a, b) =>
  !!a?.canReorder && (!!b?.canReorder || (a.key === 'custom' && b?.key === 'enablers'));

  const move = (index, dir) =>
  setLayers((prev) => {
    const to = index + dir;
    if (to < 0 || to >= prev.length) return prev;
    if (!canSwap(prev[index], prev[to])) return prev;
    const next = [...prev];
    [next[index], next[to]] = [next[to], next[index]];
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStrategy(strategy.id, { strategy_layers: serializeLayers(layers) });
      toast({ title: 'Strategy settings saved' });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <MotionModal
        isOpen={isOpen}
        onClose={requestClose}
        title={
        <span className="flex flex-col gap-0.5">
            <span className="text-xl font-bold text-foreground">Customise Strategy</span>
            <span className="font-normal text-muted-foreground text-xs">{TAB_GUIDES[tab]}</span>
          </span>
        }
        maxWidth="max-w-4xl"
        footer={tab === 'foundations' ? null :
        <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={requestClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>Save Changes</Button>
          </div>
        }>

        <div className="mb-5">
          <StrategyCapsuleTabs tabs={tabs} value={tab} onChange={changeTab} />
        </div>

        {/* Fixed frame — every tab matches the hierarchy tab's size; Foundations
            has no footer, so it absorbs the footer's height to keep the modal identical. */}
        <div className={tab === 'foundations' ? 'h-[calc(55vh+73px)]' : 'h-[55vh]'}>
        {tab === 'hierarchy' &&
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
            <div className="space-y-3 h-full overflow-y-auto pr-2">
              {layers.map((layer, index) =>
            <LayerConfigRow
              key={layer.key}
              layer={layer}
              canMoveUp={index > 0 && canSwap(layer, layers[index - 1])}
              canMoveDown={index < layers.length - 1 && canSwap(layer, layers[index + 1])}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onNameChange={(v) => patch(layer.key, { name: v })}
              onEnabledChange={(v) => patch(layer.key, { enabled: v })} />
            )}
            </div>

            <HierarchyPreview layers={layers} />
          </div>
        }

        {tab === 'foundations' &&
        <StrategicFoundationsTab strategy={strategy} onSaved={onSaved} onDirtyChange={setSubDirty} />
        }

        {tab === 'theme' &&
        <div className="h-full overflow-y-auto pr-2">
          <ManageLevel2Panel
            strategyId={strategy?.id}
            levelName={themeName}
            items={level2}
            blocks={blocks}
            onChanged={onLevel2Changed}
            onDirtyChange={setSubDirty} />
        </div>
        }
        </div>
      </MotionModal>
      {dialog}
      <DiscardChangesDialog
        isOpen={!!pendingTab}
        onClose={() => setPendingTab(null)}
        onConfirm={confirmTabSwitch}
        subject="strategy settings changes" />
    </>);
}