import React, { useState } from 'react';
import { HelpCircle, Menu, PanelLeft } from 'lucide-react';
import HelpSupportPane from '@/components/help/HelpSupportPane';
import ThemeTogglePill from '@/components/layout/ThemeTogglePill';
import { Button } from '@/components/ui/button';
import AccountMenu from '@/components/layout/AccountMenu';
import { useAuth } from '@/lib/AuthContext';
import { TOP_BAR_BACK_SLOT } from '@/components/shared/TopBarBack';

export default function TopBar({ onToggleSidebar, onToggleRail }) {
  const { user } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile drawer toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </Button>
        {/* Desktop sidebar collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hidden lg:flex text-muted-foreground hover:text-foreground"
          onClick={onToggleRail}
          title="Toggle navigation"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
        {/* Detail pages show their "Back to …" link here (TopBarBack). */}
        <div id={TOP_BAR_BACK_SLOT} className="min-w-0" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-1">
        <ThemeTogglePill />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setHelpOpen(true)}
          title="Help & Support"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        <AccountMenu user={user} initials={initials} />
      </div>

      <HelpSupportPane isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}