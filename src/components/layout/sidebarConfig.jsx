import {
  BookUser, LayoutDashboard, FileText, Target, ClipboardList,
  Calendar, FolderOpen, UserCheck, Settings, Shield, UsersRound,
  HandHeart, Clipboard, Users2, BadgeCheck, Crosshair, Building2,
  ScrollText, ClipboardCheck, ListChecks, MessageCircleMore, Gavel
} from 'lucide-react';

export const sidebarSections = [
  {
    id: 'conversations',
    label: 'Conversations',
    path: '/conversations',
    icon: MessageCircleMore,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    path: '/contacts',
    icon: BookUser,
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
  },
  {
    id: 'grants',
    label: 'Grant Management',
    icon: Building2,
    iconBg: 'bg-purple-500',
    iconColor: 'text-white',
    children: [
      { label: 'Dashboard', path: '/grants/dashboard', icon: LayoutDashboard },
      { label: 'Register', path: '/grants/register', icon: ClipboardList },
      { label: 'Obligations', path: '/grants/reporting', icon: FileText },
    ],
  },
  {
    id: 'programs',
    label: 'Program Management',
    path: '/programs/overview',
    icon: Target,
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
  },
  {
    id: 'board',
    label: 'Board Management',
    icon: Users2,
    iconBg: 'bg-rose-500',
    iconColor: 'text-white',
    children: [
      { label: 'Meetings', path: '/board/meetings', icon: Calendar },
      { label: 'Documents', path: '/board/documents', icon: FolderOpen },
      { label: 'Actions', path: '/board/meeting-actions', icon: ClipboardList },
      { label: 'Decisions', path: '/board/decisions', icon: Gavel },
      { label: 'Work Plan', path: '/board/work-plans', icon: ListChecks },
      { label: 'People', path: '/board/people', icon: UsersRound },
      { label: 'Committees', path: '/board/committees', icon: UserCheck },
    ],
  },
  {
    id: 'membership',
    label: 'Membership Management',
    icon: BadgeCheck,
    iconBg: 'bg-cyan-500',
    iconColor: 'text-white',
    children: [
      { label: 'Register', path: '/membership/members', icon: ClipboardList },
      { label: 'Configuration', path: '/membership/configuration', icon: Settings },
    ],
  },
  {
    id: 'strategy',
    label: 'Strategy Management',
    path: '/strategy/register',
    icon: Crosshair,
    iconBg: 'bg-indigo-500',
    iconColor: 'text-white',
  },
  {
    id: 'risk',
    label: 'Risk Management',
    icon: Shield,
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    children: [
      { label: 'Dashboard', path: '/risk/dashboard', icon: LayoutDashboard },
      { label: 'Register', path: '/risk/register', icon: ClipboardList },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance Management',
    icon: ClipboardCheck,
    iconBg: 'bg-module-contacts',
    iconColor: 'text-white',
    children: [
      { label: 'Calendar', path: '/compliance/obligations', icon: Calendar },
      { label: 'Registers', path: '/compliance/registers', icon: ClipboardList },
      { label: 'Policy', path: '/compliance/policy', icon: ScrollText },
    ],
  },
  {
    id: 'volunteers',
    label: 'Volunteer Management',
    icon: HandHeart,
    iconBg: 'bg-emerald-500',
    iconColor: 'text-white',
    children: [
      { label: 'Volunteer Register', path: '/volunteers/register', icon: Clipboard },
      { label: 'Volunteer Programs', path: '/volunteers/programs', icon: Settings },
    ],
  },
];