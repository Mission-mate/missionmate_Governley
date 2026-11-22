import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// The module icon tile lifts on row hover and a little more while pressed; the label stays still.
const ICON_LIFT = "transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-md group-active:-translate-y-1 motion-reduce:transition-none motion-reduce:transform-none";

/** `badge` is an optional marker drawn on the corner of the item's icon tile. */
export default function SidebarNavItem({ item, isOpen, onToggle, collapsed, badge }) {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = location.pathname === item.path;
  const isChildActive = hasChildren && item.children.some(c => location.pathname === c.path);

  // Collapsed rail: show only the colored icon box, linking to the section's path
  // (or its first child when the section has no direct path).
  // Collapsed rail: module icon plus each sub-page icon, flattened into one
  // straight vertical column. Labels appear as hover tooltips.
  if (collapsed) {
    const target = item.path || (hasChildren ? item.children[0].path : '/');
    return (
      <div className="flex flex-col items-center gap-0.5">
        <Link
          to={target}
          title={item.label}
          className={cn(
            "group flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-200",
            isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
          )}
        >
          {item.icon && (
            <div className={cn(
              "relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              ICON_LIFT,
              item.iconBg || "bg-primary/10"
            )}>
              <item.icon className={cn(item.iconColor || "text-primary")} style={{ width: '18px', height: '18px' }} />
              {badge}
            </div>
          )}
        </Link>
        {hasChildren && item.children.map(child => (
          <Link
            key={child.path}
            to={child.path}
            title={`${item.label} — ${child.label}`}
            className={cn(
              "flex items-center justify-center w-11 h-9 rounded-lg transition-all duration-200",
              location.pathname === child.path
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {child.icon && <child.icon className="w-4 h-4 shrink-0" />}
          </Link>
        ))}
      </div>
    );
  }

  if (!hasChildren) {
    return (
      <Link
        to={item.path}
        className={cn(
          "group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
          "hover:bg-sidebar-accent",
          isActive ? "text-sidebar-primary" : "text-foreground"
        )}
      >
        {item.icon && (
          <div className={cn(
            "relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            ICON_LIFT,
            item.iconBg || "bg-primary/10"
          )}>
            <item.icon className={cn("w-4.5 h-4.5", item.iconColor || "text-primary")} style={{ width: '18px', height: '18px' }} />
            {badge}
          </div>
        )}
        <span className="truncate flex-1 text-left">{item.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
          "hover:bg-sidebar-accent",
          isChildActive || isActive
            ? "text-sidebar-primary"
            : "text-foreground"
        )}
      >
        {item.icon && (
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            ICON_LIFT,
            item.iconBg || "bg-primary/10"
          )}>
            <item.icon className={cn("w-4.5 h-4.5", item.iconColor || "text-primary")} style={{ width: '18px', height: '18px' }} />
          </div>
        )}
        <span className="truncate flex-1 text-left">{item.label}</span>
        <ChevronUp
          className={cn(
            "w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200",
            !isOpen && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-5 pl-4 border-l border-sidebar-border space-y-0.5 py-1">
              {item.children.map(child => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    location.pathname === child.path
                      ? "text-sidebar-primary font-medium"
                      : "text-sidebar-foreground"
                  )}
                >
                  {child.icon && <child.icon className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{child.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}