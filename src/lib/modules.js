import {
  BookUser, Building2, FolderKanban, Crosshair,
  Users2, BadgeCheck, Shield, Target, ClipboardCheck, MessageCircleMore
} from 'lucide-react';

export const MODULES_KEY = 'modules';

/**
 * Single source of truth for modules across the app.
 * `id` maps 1:1 to a sidebar section id in sidebarConfig.
 * Used by Settings → Objects (toggle active/inactive) and the Sidebar
 * (hide inactive sections).
 */
export const MODULES = [
  {
    id: 'conversations',
    label: 'Conversations',
    description: 'Message your team in direct and group chats',
    icon: MessageCircleMore,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    description: 'Manage your organisation’s contacts',
    icon: BookUser,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-500',
  },
  {
    id: 'grants',
    label: 'Grant Management',
    description: 'Manage grant funding and obligations',
    icon: Building2,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-500',
  },
  {
    id: 'programs',
    label: 'Program Management',
    description: 'Manage programs and their projects',
    icon: Target,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-500',
  },
  {
    id: 'board',
    label: 'Board Management',
    description: 'Manage board meetings and actions',
    icon: Users2,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-500',
  },
  {
    id: 'membership',
    label: 'Membership Management',
    description: 'Manage members and memberships',
    icon: BadgeCheck,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-500',
  },
  {
    id: 'strategy',
    label: 'Strategy Management',
    description: 'Track and manage organisational strategy',
    icon: Crosshair,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-500',
  },
  {
    id: 'risk',
    label: 'Risk Management',
    description: 'Identify, assess and manage risks',
    icon: Shield,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
  },
  {
    id: 'compliance',
    label: 'Compliance Management',
    description: 'Manage compliance obligations',
    icon: ClipboardCheck,
    iconBg: 'bg-module-contacts/20',
    iconColor: 'text-module-contacts',
  },
];

export const ALL_MODULE_IDS = MODULES.map(m => m.id);

/** Pinned to the top in this order; these modules cannot be reordered. */
export const PINNED_MODULE_IDS = ['conversations', 'contacts'];

/** Returns MODULES arranged according to a saved order of ids. */
export function orderModules(order) {
  const byId = new Map(MODULES.map((m) => [m.id, m]));
  const ordered = (order || []).map((id) => byId.get(id)).filter(Boolean);
  const missing = MODULES.filter((m) => !(order || []).includes(m.id));
  return [...ordered, ...missing];
}