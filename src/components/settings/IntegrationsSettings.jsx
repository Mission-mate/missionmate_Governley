import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StripeIntegrationCard from './StripeIntegrationCard';
import ResendIntegrationCard from './ResendIntegrationCard';
import CalendarIntegrationCard from './CalendarIntegrationCard';

export default function IntegrationsSettings() {
  const { user } = useAuth();
  const [calendarConnected, setCalendarConnected] = useState(null);

  const isAdminOrOwner = ['admin', 'owner'].includes(user?.data?._app_role) || user?.role === 'admin';

  const fetchCalendarStatus = async () => {
    try {
      const res = await base44.functions.invoke('calendarStatus', {});
      setCalendarConnected(res.data?.connected || null);
    } catch {
      setCalendarConnected(null);
    }
  };

  useEffect(() => { fetchCalendarStatus(); }, []);

  const handleConnectCalendar = () => {
    alert('To connect a calendar, ask your Missionmate builder to authorise it — once connected, a calendar event is created automatically for every new board meeting.');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Integrations</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage connections to platforms and services.</p>

      <div className="mb-8">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Payments</h2>
        <StripeIntegrationCard />
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Communication</h2>
        <ResendIntegrationCard />
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">Calendar</h2>
        <p className="text-sm text-muted-foreground mb-4">Choose a shared calendar to connect and manage your meetings</p>
        <CalendarIntegrationCard
          isAdminOrOwner={isAdminOrOwner}
          connectedId={calendarConnected}
          onConnect={handleConnectCalendar}
        />
      </div>
    </div>
  );
}