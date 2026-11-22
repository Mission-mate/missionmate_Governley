import React, { useState } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PublicMembershipForm from '@/pages/PublicMembershipForm';

/**
 * Full-screen overlay that renders the real public membership registration
 * flow in sandbox mode, so admins can walk the exact end-user journey
 * (banner, logo, plan cards, application form, payment, submit) without
 * creating any records. A Web / Mobile toggle switches between a full-width
 * desktop view and a phone-sized preview frame.
 */
export default function SandboxPreviewOverlay({ onClose }) {
  const [view, setView] = useState('web');
  const mobile = view === 'mobile';

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div>
          <p className="text-sm font-bold text-foreground">Member Registration Preview</p>
          <p className="text-xs text-muted-foreground">Live view of your saved configuration</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Web / Mobile toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setView('web')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                !mobile ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Monitor className="w-3.5 h-3.5" /> Web
            </button>
            <button
              type="button"
              onClick={() => setView('mobile')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                mobile ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5">
            <X className="w-4 h-4" /> Close
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mobile ? (
          <div className="flex justify-center py-8 px-4">
            {/* Phone frame */}
            <div className="w-[390px] max-w-full rounded-[2.5rem] border-[10px] border-foreground/80 bg-background shadow-2xl overflow-hidden">
              <div className="h-[780px] max-h-[calc(100vh-8rem)] overflow-y-auto">
                <PublicMembershipForm sandbox mobile />
              </div>
            </div>
          </div>
        ) : (
          <PublicMembershipForm sandbox />
        )}
      </div>
    </div>
  );
}