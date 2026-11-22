import React from 'react';
import { cn } from '@/lib/utils';
import LevelIcon from '@/components/strategy/connections/LevelIcon';

const Pill = ({ children, level, variant = 'outline', className }) => (
  <div
    className={cn(
      'h-9 flex items-center justify-center gap-2 rounded-full text-xs font-medium px-3 truncate',
      variant === 'filled' && 'bg-primary/10 text-foreground',
      variant === 'outline' && 'bg-card border border-border text-foreground',
      variant === 'muted' && 'bg-muted text-foreground',
      className
    )}
  >
    <LevelIcon level={level} size="sm" className="w-5 h-5 shadow-sm [&_svg]:w-3 [&_svg]:h-3" />
    <span className="truncate">{children}</span>
  </div>
);

/**
 * Live visual preview of the strategy hierarchy — reflects the working (unsaved)
 * layer order, names and enabled flags from the customizer.
 */
export default function HierarchyPreview({ layers }) {
  const visible = layers.filter((l) => l.enabled !== false);

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-5 h-full">
      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground text-center mb-5">
        HIERARCHY PREVIEW
      </p>
      <div className="space-y-2.5">
        {visible.map((layer, i) => {
          if (layer.key === 'enablers' || i === 0) {
            return (
              <Pill key={layer.key} level={layer.level} variant={i === 0 ? 'filled' : 'muted'} className="w-3/4 mx-auto">
                {layer.name}
              </Pill>
            );
          }
          const variant = i % 2 === 0 ? 'muted' : 'outline';
          return (
            <div key={layer.key} className="grid grid-cols-2 gap-2.5">
              <Pill level={layer.level} variant={variant}>{layer.name}</Pill>
              <Pill level={layer.level} variant={variant}>{layer.name}</Pill>
            </div>
          );
        })}
      </div>
    </div>
  );
}