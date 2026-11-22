import React from 'react';
import { CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GUIDE_TEXT = 'Connect calendar to automatically create a calendar event whenever a new meeting is scheduled';

const GoogleCalendarLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="7" fill="#4285F4" />
    <rect x="9" y="8" width="14" height="16" rx="2" fill="#fff" />
    <text x="16" y="21" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4285F4" fontFamily="Arial, sans-serif">31</text>
  </svg>
);

const OutlookCalendarLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="7" fill="#0F6CBD" />
    <rect x="9" y="8" width="14" height="16" rx="2" fill="#fff" />
    <rect x="9" y="8" width="14" height="4" rx="2" fill="#28A8EA" />
    <text x="16" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0F6CBD" fontFamily="Arial, sans-serif">O</text>
  </svg>
);

const CALENDARS = [
  {
    id: 'googlecalendar',
    name: 'Google Calendar',
    description: GUIDE_TEXT,
    logo: <GoogleCalendarLogo />,
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    description: GUIDE_TEXT,
    logo: <OutlookCalendarLogo />,
  },
];

/**
 * Calendar integration options. Connecting a calendar lets the app
 * automatically create an event whenever a new board meeting is scheduled.
 * The OAuth connection is established by the workspace admin via the platform.
 */
export default function CalendarIntegrationCard({ isAdminOrOwner, connectedId, onConnect }) {
  return (
    <div className="space-y-4">
      {CALENDARS.map((cal) => {
        const isConnected = connectedId === cal.id;
        return (
          <div
            key={cal.id}
            className={`border rounded-xl p-5 flex items-start gap-4 ${isConnected ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}
          >
            <div className="shrink-0 mt-0.5">{cal.logo}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-foreground">{cal.name}</h3>
                {isConnected && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{cal.description}</p>
            </div>
            <div className="shrink-0">
              {isConnected ? (
                <Button variant="outline" size="sm" className="text-muted-foreground gap-1.5" disabled>
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Connected
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5"
                  disabled={!isAdminOrOwner}
                  onClick={() => onConnect?.(cal.id)}
                >
                  <CalendarClock className="w-4 h-4" /> Connect
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {!isAdminOrOwner && (
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg border border-border">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">Only Admins and Account Owners can connect a calendar.</p>
        </div>
      )}
    </div>
  );
}