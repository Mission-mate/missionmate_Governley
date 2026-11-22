import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LIFT_HOVER } from '@/components/shared/liftHover';

// The top bar renders an empty element with this id; a page's back link is shown inside it.
export const TOP_BAR_BACK_SLOT = 'top-bar-back';

/**
 * A page's "Back to …" link, shown in the top bar instead of the page content.
 * Pass `onClick` to run the page's own leave logic, or `to` for a plain route.
 */
export default function TopBarBack({ to, onClick, children }) {
  const navigate = useNavigate();
  const [slot, setSlot] = useState(null);
  useEffect(() => { setSlot(document.getElementById(TOP_BAR_BACK_SLOT)); }, []);
  if (!slot) return null;

  return createPortal(
    <button
      type="button"
      onClick={onClick || (() => navigate(to))}
      className={`flex items-center gap-1.5 max-w-full text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${LIFT_HOVER}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" />
      <span className="truncate">{children}</span>
    </button>,
    slot
  );
}