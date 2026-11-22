import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LIFT_HOVER } from '@/components/shared/liftHover';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MyProfile from '@/components/settings/MyProfile';
import OrganisationProfile from '@/components/settings/OrganisationProfile';
import StaffManagement from '@/components/settings/StaffManagement';
import Customisation from '@/components/settings/Customisation';
import CustomFields from '@/components/settings/CustomFields';
import TagsManagement from '@/components/settings/tags/TagsManagement';
import IntegrationsSettings from '@/components/settings/IntegrationsSettings';
import { cn } from '@/lib/utils';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import { useAuth } from '@/lib/AuthContext';

const settingsNav = [
  { id: 'my-profile', label: 'My Profile' },
  { id: 'profile', label: 'Organisation Profile' },
  { id: 'staff', label: 'Team Management' },
  { id: 'customisation', label: 'Customisation' },
  { id: 'custom-fields', label: 'Custom Fields' },
  { id: 'tags', label: 'Tags' },
  { id: 'integrations', label: 'Integrations', adminOnly: true },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrOwner = ['admin', 'owner'].includes(user?.data?._app_role) || user?.role === 'admin';
  const visibleNav = settingsNav.filter(item =>
    (!item.adminOnly || isAdminOrOwner)
  );
  // A link can open a specific tab, e.g. /settings?tab=my-profile from the header menu.
  const [activeTab, setActiveTab] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    return visibleNav.some((item) => item.id === requested) ? requested : 'profile';
  });
  const [leaving, setLeaving] = useState(false);
  const leave = usePageLeaveGuard();

  const handleGoBack = () => leave.guard(() => {
    setLeaving(true);
    setTimeout(() => navigate('/'), 220);
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: leaving ? 0 : 1, x: leaving ? 30 : 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="min-h-screen bg-background"
    >
      {leave.dialog}
      <div className="flex min-h-screen">
        {/* Left sidebar */}
        <aside className="w-52 shrink-0 border-r border-border bg-white dark:bg-card flex flex-col pt-5 px-5">
          {/* Go Back */}
          <button
            onClick={handleGoBack}
            className={`flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 ${LIFT_HOVER}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <p className="text-xs font-bold text-foreground tracking-widest uppercase mb-4">
            Settings
          </p>

          <nav className="space-y-0.5">
            {visibleNav.map(item => (
              <button
                key={item.id}
                onClick={() => { if (item.id !== activeTab) leave.guard(() => setActiveTab(item.id)); }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap",
                  activeTab === item.id
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-12 py-10 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto">
            {activeTab === 'my-profile' && <MyProfile />}
            {activeTab === 'profile' && <OrganisationProfile />}
            {activeTab === 'staff' && <StaffManagement />}
            {activeTab === 'customisation' && <Customisation />}
            {activeTab === 'custom-fields' && <CustomFields />}
            {activeTab === 'tags' && <TagsManagement />}
            {activeTab === 'integrations' && isAdminOrOwner && <IntegrationsSettings />}
          </div>
        </main>
      </div>
    </motion.div>
  );
}