import React from 'react';
import { Download, ExternalLink, Eye, Move, Pencil, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import FloatingBarMotion from '@/components/shared/FloatingBarMotion';

const BTN = 'h-7 gap-1.5 px-2.5 text-[13px]';
const ICON = 'w-3.5 h-3.5';

/**
 * Single-selection action bar for a folder (Open, Edit, Delete) or a document
 * (View, Open, Download, Edit, Delete — pass `onView` / `onDownload`). View, Download and Edit
 * and Delete show only when their handler is passed.
 * `floating` pins it to the bottom of the page; otherwise it sticks to the
 * bottom of the side pane it is rendered in.
 */
export default function SelectionActionBar({ open, floating = false, canOpen = true, onView, onOpen, onDownload, onEdit, onMove, moveActive = false, onDelete, onClear }) {
  // The floating (full-page) bar matches the Notes table selection bar's size.
  const btn = floating ? 'h-8 gap-2 text-sm' : BTN;
  const icon = floating ? 'w-4 h-4' : ICON;
  const pill = (
    <div className={floating
      ? 'flex items-center gap-1 rounded-full border border-border bg-card shadow-lg px-3 py-2'
      : 'flex items-center gap-0.5 px-1.5 py-1 rounded-full border border-border bg-card shadow-lg max-w-full'}>
      {floating &&
        <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
          <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">1</span>
          <span className="text-sm font-medium text-foreground">selected</span>
        </div>
      }
      {onView &&
        <Button variant="ghost" size="sm" onClick={onView} disabled={!canOpen} className={btn}>
          <Eye className={icon} /> View
        </Button>
      }
      <Button variant="ghost" size="sm" onClick={onOpen} disabled={!canOpen} className={btn}>
        <ExternalLink className={icon} /> Open
      </Button>
      {onDownload &&
        <Button variant="ghost" size="sm" onClick={onDownload} disabled={!canOpen} className={btn}>
          <Download className={icon} /> Download
        </Button>
      }
      {onEdit &&
        <Button variant="ghost" size="sm" onClick={onEdit} className={btn}>
          <Pencil className={icon} /> Edit
        </Button>
      }
      {onMove &&
        <Button variant="ghost" size="sm" onClick={onMove} className={`${btn} ${moveActive ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : ''}`}>
          <Move className={icon} /> {moveActive ? 'Done' : 'Move'}
        </Button>
      }
      {onDelete &&
        <Button variant="ghost" size="sm" onClick={onDelete} className={`${btn} text-destructive hover:text-destructive hover:bg-destructive/10`}>
          <Trash2 className={icon} /> Delete
        </Button>
      }
      {!floating && <span className="w-px h-4 bg-border mx-1" />}
      <button type="button" onClick={onClear} title="Clear selection" className={`${floating ? 'w-8 h-8' : 'w-7 h-7'} rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors`}>
        <X className={icon} />
      </button>
    </div>
  );

  if (floating) return <FloatingBarMotion show={open}>{pill}</FloatingBarMotion>;

  return (
    <AnimatePresence>
      {open &&
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className="sticky bottom-0 z-10 mt-auto flex justify-center pt-4 pb-1">
          {pill}
        </motion.div>
      }
    </AnimatePresence>
  );
}