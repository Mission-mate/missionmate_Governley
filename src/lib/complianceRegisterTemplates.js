/**
 * Pre-built compliance register templates (alphabetical).
 * Read-only library — users can only add these to their register table.
 */
import {
  Package, MessageSquareWarning, FileSignature, HeartHandshake,
  Gift, ShieldCheck, Cross, Database, UserCheck, Scale,
} from 'lucide-react';

export const REGISTER_TEMPLATES = [
  { id: 'complaints', title: 'Complaints Register', description: 'Record complaints, handling and resolution.', icon: MessageSquareWarning, color: 'bg-orange-50 text-orange-600' },
  { id: 'conflict_of_interest', title: 'Conflict of Interest Register', description: 'Record and manage conflicts of interest for any person.', icon: Scale, color: 'bg-purple-50 text-purple-600' },
  { id: 'contracts', title: 'Contracts and Agreements Register', description: 'Maintain contracts, agreements and renewal dates.', icon: FileSignature, color: 'bg-slate-100 text-slate-600' },
  { id: 'responsible_people', title: 'Details of Responsible People', description: 'Maintain past and present committee member details.', icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'donor', title: 'Donor Register', description: 'Maintain donor details and contribution history.', icon: HeartHandshake, color: 'bg-rose-50 text-rose-600' },
  { id: 'asset', title: 'Fixed Asset Register', description: 'Track organisational assets, values and condition.', icon: Package, color: 'bg-blue-50 text-blue-600' },
  { id: 'gifts_hospitality', title: 'Gift, Benefits and Hospitality Register', description: 'Declare gifts, benefits and hospitality received.', icon: Gift, color: 'bg-pink-50 text-pink-600' },
  { id: 'information_asset', title: 'Information Asset Register', description: 'Record information holdings, sensitivity and location.', icon: Database, color: 'bg-cyan-50 text-cyan-600' },
  { id: 'whs', title: 'Work Health and Safety Register', description: 'Manage WHS obligations and safety records.', icon: Cross },
  { id: 'police_check', title: 'Workforce Licences and Credentials Register', description: 'Manage all staff certifications and clearance checks', icon: ShieldCheck, color: 'bg-sky-50 text-sky-600' },
];

export function getTemplate(id) {
  return REGISTER_TEMPLATES.find((t) => t.id === id) || null;
}