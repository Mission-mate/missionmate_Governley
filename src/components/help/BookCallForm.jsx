import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, ExternalLink, Clock, Video } from 'lucide-react';

// Replace this with your real scheduling link (Calendly, etc.)
const BOOKING_URL = 'https://calendly.com';

export default function BookCallForm() {
  return (
    <div className="px-5 py-4 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CalendarDays className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Book a Call</h3>
          <p className="text-xs text-muted-foreground">Talk through your needs with our team</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">30-minute session</p>
            <p className="text-xs text-muted-foreground">Pick a time that suits you</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Video className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Online video call</p>
            <p className="text-xs text-muted-foreground">Link sent after booking</p>
          </div>
        </div>
      </div>

      <Button className="w-full gap-2" onClick={() => window.open(BOOKING_URL, '_blank')}>
        Open Scheduler
        <ExternalLink className="w-4 h-4" />
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Opens our booking calendar in a new tab
      </p>
    </div>
  );
}