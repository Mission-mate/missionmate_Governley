import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import EditKeyContactsPane from '@/components/grants/detail/EditKeyContactsPane';
import EditGrantPane from '@/components/grants/detail/EditGrantPane';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionEditButton from '@/components/shared/SectionEditButton';

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  closed: 'bg-blue-50 text-blue-700 border border-blue-200',
  archived: 'bg-amber-50 text-amber-700 border border-amber-200'
};

function fmtDate(d) {
  if (!d) return '–';
  try {return format(parseISO(d), 'dd MMM yyyy');} catch {return d;}
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function GrantOverviewTab({ grant, onUpdate }) {
  const { toast } = useToast();
  const [showEditPane, setShowEditPane] = useState(false);
  const [showEditContacts, setShowEditContacts] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (fields) => {
    try {
      setSaving(true);
      await base44.entities.Grant.update(grant.id, fields);
      onUpdate();
      return true;
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save grant details.', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const keyContacts = grant.provider_contacts || [];

  return (
    <div className="flex gap-6">
      {/* Left column */}
      <div className="flex-1 min-w-0">
        <div className={cn(ELEVATED_SECTION, 'space-y-6')}>
        {/* Project/Program Title with Edit button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-foreground">Grant Activity</h3>
            <SectionEditButton onClick={() => setShowEditPane(true)} />
          </div>
          <p className={cn('text-sm', grant.program ? 'text-muted-foreground' : 'text-muted-foreground/50 italic')}>
            {grant.program || 'Not provided'}
          </p>
        </div>

        {/* Project/Program Description */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-1">Description</h3>
          <p className={cn('text-sm leading-relaxed whitespace-pre-wrap', grant.description ? 'text-muted-foreground' : 'text-muted-foreground/50 italic')}>
            {grant.description || 'Not provided'}
          </p>
        </div>

        {/* Dates + Status row */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Grant Start Date</p>
            <p className="text-sm font-semibold text-foreground">{fmtDate(grant.start_date)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Grant End Date</p>
            <p className="text-sm font-semibold text-foreground">{fmtDate(grant.end_date)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Grant Status</p>
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold capitalize', STATUS_STYLES[grant.status] || STATUS_STYLES.active)}>
              {grant.status}
            </span>
          </div>
        </div>

        {/* Funder Details */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">Funder Details</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{grant.provider || '–'}</p>
                <p className="text-xs text-muted-foreground">Grant Provider</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Right column — Key Contacts */}
      <div className="w-72 shrink-0">
        <div className={ELEVATED_SECTION}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">Key Contacts</h3>
            <SectionEditButton onClick={() => setShowEditContacts(true)} />
          </div>

          {keyContacts.map((c, i) =>
          <div key={i} className="mb-4">
              {c.role && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{c.role}</p>}
              <ContactCard contact={c} />
            </div>
          )}

          {grant.internal_owner &&
          <div className="mb-4 pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Internal Lead</p>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{initials(grant.internal_owner)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{grant.internal_owner}</p>
                  {grant.internal_owner_role && <p className="text-xs text-muted-foreground">{grant.internal_owner_role}</p>}
                </div>
              </div>
            </div>
          }

        </div>
      </div>

      <EditGrantPane
        isOpen={showEditPane}
        onClose={() => setShowEditPane(false)}
        grant={grant}
        onSave={save} />
      

      <EditKeyContactsPane
        isOpen={showEditContacts}
        onClose={() => setShowEditContacts(false)}
        grant={grant}
        onSave={save} />
      
    </div>);

}

function ContactCard({ contact }) {
  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{initials(contact.name)}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{contact.name}</p>
        {contact.email &&
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Mail className="w-3 h-3" /> <span className="truncate">{contact.email}</span>
          </div>
        }
        {contact.phone &&
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Phone className="w-3 h-3" /> <span>{contact.phone}</span>
          </div>
        }
      </div>
    </div>);

}