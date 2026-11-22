import React from 'react';
import { ChevronUp, ChevronDown, Trash2, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const ArrowBtn = ({ icon: Icon, disabled, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'w-6 h-6 flex items-center justify-center rounded-md border border-border text-muted-foreground transition-colors',
      disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted hover:text-foreground'
    )}
  >
    <Icon className="w-3.5 h-3.5" />
  </button>
);

/** One layer row in the Strategy Hierarchy customizer — rename, toggle, reorder, delete. */
export default function LayerConfigRow({
  layer,
  onNameChange,
  onEnabledChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) {
  const enabled = layer.enabled !== false;
  return (
    <div className={cn('rounded-xl bg-muted p-3 space-y-1.5', !enabled && 'opacity-60')}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground truncate">{layer.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          {layer.canDelete && (
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Remove layer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {layer.canDisable ? (
            <>
              <span className="text-xs font-medium text-muted-foreground">
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch checked={enabled} onCheckedChange={onEnabledChange} />
            </>
          ) : (
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          {layer.canReorder && (
            <div className="flex items-center gap-1 pl-1">
              <ArrowBtn icon={ChevronUp} disabled={!canMoveUp} onClick={onMoveUp} title="Move up" />
              <ArrowBtn icon={ChevronDown} disabled={!canMoveDown} onClick={onMoveDown} title="Move down" />
            </div>
          )}
        </div>
      </div>
      <Input
        value={layer.name}
        disabled={!layer.canRename || !enabled}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={layer.title}
        className={cn('h-10 rounded-lg bg-white dark:bg-card', !layer.canRename && 'text-muted-foreground')}
      />
      <p className="text-xs text-muted-foreground leading-snug">{layer.guide}</p>
    </div>
  );
}