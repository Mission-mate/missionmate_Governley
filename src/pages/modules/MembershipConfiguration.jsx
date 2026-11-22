import React, { useState } from 'react';
import { Layers, FileText, Mail, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import MembershipStructuresTab from '@/components/settings/membership/MembershipStructuresTab';
import MembershipFormBuilderTab from '@/components/settings/membership/MembershipFormBuilderTab';
import EmailTemplatesTab from '@/components/settings/membership/EmailTemplatesTab';
import MembershipSubmissionsTab from '@/components/settings/membership/MembershipSubmissionsTab';

const TABS = [
{ id: 'membership-structures', label: 'Membership Plan', icon: Layers },
{ id: 'membership-form', label: 'Membership Page', icon: FileText },
{ id: 'email-templates', label: 'Email Templates', icon: Mail },
{ id: 'membership-submissions', label: 'Membership Submissions', icon: Inbox }];


export default function MembershipConfiguration() {
  const [activeTab, setActiveTab] = useState('membership-structures');
  const leave = usePageLeaveGuard();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Configuration</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage membership settings, plans and page.

        </p>

        {leave.dialog}
        {/* Tab bar */}
        <div className="flex border-b border-border mb-6">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { if (tab.id !== activeTab) leave.guard(() => setActiveTab(tab.id)); }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                  active ?
                  'border-primary text-primary' :
                  'border-transparent text-muted-foreground hover:text-foreground'
                )}>
                
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>);

          })}
        </div>

        {/* Tab content */}
        {activeTab === 'membership-structures' && <MembershipStructuresTab />}
        {activeTab === 'membership-form' && <MembershipFormBuilderTab />}
        {activeTab === 'email-templates' && <EmailTemplatesTab />}
        {activeTab === 'membership-submissions' && <MembershipSubmissionsTab />}
      </div>
    </div>);

}