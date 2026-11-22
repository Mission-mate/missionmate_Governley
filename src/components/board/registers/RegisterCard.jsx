import React from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ELEVATED_ROW, LIFT_BUTTON } from '@/components/shared/cardStyles';

const ICON_CLASS = 'shrink-0 rounded-[12px] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.10),0_10px_24px_rgba(0,0,0,0.08)]';
const BUTTON_CLASS = `${LIFT_BUTTON} h-8 px-3 text-xs font-medium`;

/** Register home-page card (Action and Decisions registers): icon, title, description and Open / Edit / Delete. */
export default function RegisterCard({ icon: Icon, register, onOpen, onEdit, onDelete }) {
  return (
    <div className={`${ELEVATED_ROW} p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-4">
        <Icon size={56} className={ICON_CLASS} />
        <div>
          <h3 className="text-sm font-semibold text-foreground">{register.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{register.description || 'No description provided'}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onOpen} className={BUTTON_CLASS}>
          <ExternalLink className="w-4 h-4" /> Open
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit} className={BUTTON_CLASS}>
          <Pencil className="w-4 h-4" /> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className={`${BUTTON_CLASS} text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5`}>
          <Trash2 className="w-4 h-4" /> Delete
        </Button>
      </div>
    </div>
  );
}