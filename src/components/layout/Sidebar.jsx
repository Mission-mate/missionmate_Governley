import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import SidebarNavItem from './SidebarNavItem';
import NavUnreadBadge from './NavUnreadBadge';
import { sidebarSections } from './sidebarConfig';
import { useModules } from '@/hooks/useModules';
import { useOrgProfile } from '@/hooks/useOrgProfile';
import { cn } from '@/lib/utils';
import { Settings } from 'lucide-react';
export default function Sidebar({ collapsed, hasUnread }) {
  const { isModuleActive, moduleOrder } = useModules();
  const { name: orgName, logoUrl } = useOrgProfile();
  const displayName = orgName || 'Missionmate';
  const initial = displayName.charAt(0).toUpperCase();
  const [openSections, setOpenSections] = useState({
    contacts: true,
    grants: true,
    register: true,
    programs: true,
    board: true,
    membership: true,
    strategy: true,
    risk: true,
    compliance: true,
    volunteers: true,
  });

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Order module sections by the saved module order. Sections without a
  // saved rank fall back after ordered ones.
  const rank = (section) => {
    const i = moduleOrder.indexOf(section.id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const orderedSections = [...sidebarSections]
    .filter(section => isModuleActive(section.id))
    .sort((a, b) => rank(a) - rank(b));

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[261px]"
      )}
    >
      {/* Logo / Org branding */}
      <div className="flex flex-col items-center justify-center py-5 px-3 border-b border-sidebar-border shrink-0 gap-2">
        <Link to="/" className="flex flex-col items-center gap-2 w-full">
          {collapsed ? (
            <div className={cn(
              "w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center",
              !logoUrl && "bg-primary/10"
            )}>
              {logoUrl
                ? <img src={logoUrl} alt={displayName} className="w-full h-full object-contain" />
                : <span className="text-primary font-bold text-xl">{initial}</span>}
            </div>
          ) : (
            <>
              {/* Logo area: 350×180 aspect, constrained to sidebar width.
                  Background only shown for the letter placeholder, so small logos sit on transparent. */}
              <div className={cn(
                "w-full rounded-lg overflow-hidden flex items-center justify-center",
                !logoUrl && "bg-primary/10"
              )}
                style={{ aspectRatio: '350/180', maxHeight: '72px' }}>
                {logoUrl
                  ? <img src={logoUrl} alt={displayName} className="max-w-full max-h-full object-contain" />
                  : <span className="text-primary font-bold text-3xl">{initial}</span>}
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight text-center leading-tight">
                {displayName}
              </span>
            </>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          {orderedSections.map(section => (
              <SidebarNavItem
                key={section.id}
                item={section}
                collapsed={collapsed}
                isOpen={openSections[section.id]}
                onToggle={() => toggleSection(section.id)}
                badge={section.id === 'conversations' && hasUnread ? <NavUnreadBadge /> : null}
              />
            ))}
        </div>
      </ScrollArea>

      {/* Settings button at bottom */}
      <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
        <Link
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}