import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import IconTip from '@/components/shared/IconTip';
import CopilotIcon from './CopilotIcon';

const BASE = 50;

/** Icon size for a tile `distance` places from the hovered one (null = nothing hovered). */
function tileSize(distance) {
  if (distance === null) return BASE;
  const k = Math.max(0, 1 - distance / 2.6);
  return BASE * (1 + 0.4 * k);
}

/** Frosted-glass dock of copilot icons at the bottom centre; magnifies on hover and closes on a click outside it. */
export default function CopilotDock({ open, copilots, onSelect, onClose }) {
  const dockRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!open) {
      setHovered(null);
      return undefined;
    }
    const onPointerDown = (e) => {
      if (!dockRef.current?.contains(e.target)) onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onClose]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[18px] z-[150] flex justify-center px-4">
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dockRef}
            role="toolbar"
            aria-label="AI copilots"
            initial={{ opacity: 0, y: 56, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onMouseLeave={() => setHovered(null)}
            className="copilot-dock pointer-events-auto flex h-[76px] max-w-full items-end gap-[10px] rounded-[24px] px-3 pb-[11px]"
          >
            {copilots.map((copilot, index) => {
              const size = tileSize(hovered === null ? null : Math.abs(index - hovered));
              return (
                <React.Fragment key={copilot.id}>
                  {index === 1 && <span className="mb-[7px] h-9 w-px shrink-0 self-end bg-foreground/15" />}
                  <IconTip label={copilot.name}>
                    <button
                      type="button"
                      aria-label={copilot.name}
                      onMouseEnter={() => setHovered(index)}
                      onClick={() => onSelect(copilot)}
                      className="shrink-0 rounded-[12px] transition-[margin] [transition-duration:160ms] [transition-timing-function:ease] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{ marginBottom: (size - BASE) * 0.35 }}
                    >
                      <CopilotIcon
                        copilot={copilot}
                        size={size}
                        className="transition-[width,height,border-radius] [transition-duration:160ms] [transition-timing-function:ease]"
                      />
                    </button>
                  </IconTip>
                </React.Fragment>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}