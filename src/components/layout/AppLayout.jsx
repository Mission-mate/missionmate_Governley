import React, { useRef, useState } from 'react';
import useEntranceMotion from '@/hooks/useEntranceMotion';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MembershipDefaultsPrimer from '@/components/MembershipDefaultsPrimer';
import BoardDefaultsPrimer from '@/components/board/BoardDefaultsPrimer';
import useBodyLockSafetyNet from '@/hooks/useBodyLockSafetyNet';
import UnreadConversationsWatcher from './UnreadConversationsWatcher';
import { useModules } from '@/hooks/useModules';

export default function AppLayout() {
  // Clears any stranded overlay body-lock (pointer-events: none) left behind
  // when a modal/menu unmounts mid-interaction. No-op while a modal is open.
  useBodyLockSafetyNet();

  // Tracked once here: the desktop and mobile menus are both mounted and share it.
  const [hasUnread, setHasUnread] = useState(false);
  const { isModuleActive } = useModules();

  // Opacity-only page entrance (once initial data is ready) and tab-panel entrance.
  const pageRef = useRef(null);
  useEntranceMotion(pageRef);

  // Desktop rail collapse (icons only) vs full sidebar
  const [railCollapsed, setRailCollapsed] = useState(false);
  // Mobile drawer open/closed
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <MembershipDefaultsPrimer />
      <BoardDefaultsPrimer />
      {isModuleActive('conversations') && <UnreadConversationsWatcher onChange={setHasUnread} />}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile by default; smoothly collapses to full-screen on desktop */}
      <div
        className={`hidden lg:block shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${railCollapsed ? 'w-[68px]' : 'w-[261px]'}`}
      >
        <Sidebar collapsed={railCollapsed} hasUnread={hasUnread} />
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar collapsed={false} hasUnread={hasUnread} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onToggleRail={() => setRailCollapsed(prev => !prev)}
          onToggleSidebar={() => setMobileOpen(prev => !prev)}
        />
        <main ref={pageRef} className="flex-1 overflow-y-auto" data-entrance-root="">
          <Outlet />
        </main>
      </div>
    </div>
  );
}