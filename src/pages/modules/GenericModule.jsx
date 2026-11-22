import React from 'react';
import { useLocation } from 'react-router-dom';
import ModulePlaceholder from '@/components/shared/ModulePlaceholder';
import {
  ClipboardList, FileText, Target, CircleDot, Eye, Calendar, Zap,
  FolderOpen, UsersRound, UserCheck, BarChart3, Settings, HandHeart, FileCheck, Clipboard
} from 'lucide-react';

const pageConfig = {
  '/grants/register': { title: 'Grant Register', desc: 'View and manage all grant applications.', icon: ClipboardList },
  '/grants/reporting': { title: 'Reporting Obligations', desc: 'Track reporting requirements and deadlines.', icon: FileText },
  '/grants/planning': { title: 'Grant Planning', desc: 'Plan and strategize future grant applications.', icon: Target },
  '/grants/goals': { title: 'Goal Tracking', desc: 'Monitor progress towards organizational goals.', icon: CircleDot },
  '/programs/overview': { title: 'Program Management', desc: 'Manage programs, services, and their outcomes.', icon: Eye },
  '/board/meetings': { title: 'Board Meetings', desc: 'Schedule and manage board meetings and minutes.', icon: Calendar },
  '/board/actions': { title: 'Board Actions', desc: 'Track action items from board meetings.', icon: Zap },
  '/board/documents': { title: 'Board Documents', desc: 'Manage board-related documents and policies.', icon: FolderOpen },
  '/board/people': { title: 'Board People', desc: 'Manage board members and their details.', icon: UsersRound },
  '/board/committees': { title: 'Board Committees', desc: 'Manage committees and their members.', icon: UserCheck },
  '/membership/members': { title: 'Members', desc: 'Manage organization members and subscriptions.', icon: UsersRound },
  '/membership/analytics': { title: 'Membership Analytics', desc: 'Insights into membership trends and engagement.', icon: BarChart3 },
  '/membership/settings': { title: 'Membership Settings', desc: 'Configure membership tiers and pricing.', icon: Settings },
  '/volunteers/register': { title: 'Volunteer Register', desc: 'Manage volunteer details and availability.', icon: Clipboard },
  '/volunteers/programs': { title: 'Volunteer Programs', desc: 'Coordinate volunteer programs and schedules.', icon: HandHeart },
  '/policy/register': { title: 'Policy Register', desc: 'Track all organizational policies and reviews.', icon: ClipboardList },
  '/policy/templates': { title: 'Policy Templates', desc: 'Create and manage policy templates.', icon: FileCheck },
};

export default function GenericModule() {
  const location = useLocation();
  const config = pageConfig[location.pathname] || {
    title: 'Module',
    desc: 'This module is being configured.',
    icon: Eye,
  };

  return <ModulePlaceholder title={config.title} description={config.desc} icon={config.icon} />;
}