import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { CreditCard, Calendar, Info } from 'lucide-react';
import SectionEditButton from '@/components/shared/SectionEditButton';
import { Input } from '@/components/ui/input';
import CardEditFooter from '@/components/shared/CardEditFooter';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { MEMBER_STATUSES, calculateExpirationDate } from '@/lib/membership';
import { resolveFee, formatFee, renewalLabel, hasSelectableTiers } from '@/lib/membershipFee';
import DateField from '@/components/ui/DateField';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import { badgeTone } from '@/lib/statusBadge';
import { resolveStructureName, resolveTierName } from '@/lib/memberPlanNames';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Online Payment', 'Invoice'];

const STATUS_STYLES = {
  active: badgeTone('green'),
  pending: badgeTone('amber'),
  expired: badgeTone('red'),
};

// Payment states. 'Pending' here means payment is expected but not yet received —
// unrelated to the membership STATUS_STYLES 'pending' approval state above.
const PAYMENT_STATUS_STYLES = {
  Paid: badgeTone('green'),
  Pending: badgeTone('amber'),
  Overdue: badgeTone('red'),
};

const fmtDate = (d) => {
  if (!d) return '–';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '–'; }
};

export const ONLINE_PAYMENT_TYPE_LABELS = {
  one_time: 'One-time Payment',
  recurrent: 'Recurrent Payment',
};

// Guide text shown under the Payment Type field when it's an online payment.
const onlinePaymentGuide = (type) => {
  if (type === 'recurrent') return 'Automatically rebills';
  if (type === 'one_time') return 'Does not automatically rebill';
  return '';
};

function StatusBadge({ status }) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '–';
  return (
    <span className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${STATUS_STYLES[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  if (!status) return <span className="text-muted-foreground">–</span>;
  return (
    <span className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-0.5 ${PAYMENT_STATUS_STYLES[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
}

function LabelWithHelp({ label, help }) {
  return (
    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
      {label}
      {help && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground/70 hover:text-foreground">
              <Info className="w-3 h-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px]">{help}</TooltipContent>
        </Tooltip>
      )}
    </p>
  );
}

function ReadField({ label, help, children }) {
  return (
    <div>
      <LabelWithHelp label={label} help={help} />
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

export default function MembershipDetailsCard({
  member, structures = [], onSaved, readOnly = false,
  // Edit state is owned by the parent so only one section card edits at a time.
  editing = false, onRequestEdit = () => {}, onCloseEdit = () => {}, onDirty = () => {},
  // True when another card holds an unsaved draft — this card's Edit is blocked.
  editDisabled = false,
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  // Seeded from the member snapshot when editing opens, so a background refetch
  // mid-edit can never overwrite in-progress changes.
  const openEdit = () => {
    setForm({
      membership_structure_id: member.membership_structure_id || '',
      membership_tier_id: member.membership_tier_id || '',
      status: member.status || 'active',
      start_date: member.start_date || '',
      expiration_date: member.expiration_date || '',
      payment_method: member.payment_method || '',
      online_payment_type: member.online_payment_type || '',
      payment_status: member.payment_status || '',
    });
    onRequestEdit();
  };

  // Any field change marks this card's draft dirty for the edit mutex.
  const setField = (patch) => { onDirty(); setForm((f) => ({ ...f, ...patch })); };

  // While editing, plan-derived fields follow the form; otherwise they follow the
  // live member record so the read view stays accurate across refetches.
  const activeStructureId = editing ? form.membership_structure_id : member.membership_structure_id;
  const activeTierId = editing ? form.membership_tier_id : member.membership_tier_id;
  const selectedStructure = useMemo(
    () => structures.find((s) => s.id === activeStructureId) || null,
    [structures, activeStructureId]
  );
  const showTiers = hasSelectableTiers(selectedStructure);
  const selectedTier = useMemo(
    () => (selectedStructure?.tiers || []).find((t) => t.id === activeTierId) || null,
    [selectedStructure, activeTierId]
  );
  const isLifetime = !!selectedStructure?.is_lifetime;

  // Expiration date is always derived from the plan — never manually editable.
  useEffect(() => {
    if (!editing || !selectedStructure) return;
    setForm((f) => ({ ...f, expiration_date: calculateExpirationDate(f.start_date, selectedStructure) }));
  }, [selectedStructure, form.start_date, editing]);

  const feeDisplay = (structure, tier) => {
    if (!structure) return '–';
    if (!structure.fee_type || structure.fee_type === 'Free' || structure.fee_type === 'No Membership Fee') return 'Free';
    if (structure.fee_type === 'Custom') return 'Assessed individually';
    return formatFee(resolveFee(structure, tier));
  };

  const renewalDisplay = (structure) => {
    if (!structure) return '–';
    const label = renewalLabel(structure);
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : '–';
  };

  const handleSave = async () => {
    if (!form.membership_structure_id) { toast({ title: 'Membership plan is required', variant: 'destructive' }); return; }
    try {
      setSaving(true);
      await base44.entities.Member.update(member.id, {
        membership_structure_id: form.membership_structure_id,
        membership_structure_name: selectedStructure?.name || member.membership_structure_name || '',
        membership_tier_id: showTiers ? form.membership_tier_id : '',
        membership_tier_name: showTiers ? (selectedTier?.name || '') : '',
        status: form.status,
        start_date: form.start_date,
        expiration_date: isLifetime ? '' : form.expiration_date,
        payment_method: form.payment_method,
        online_payment_type: form.payment_method === 'Online Payment' ? form.online_payment_type : '',
        payment_status: form.payment_status,
      });
      toast({ title: 'Member updated' });
      if (onSaved) await onSaved();
      onCloseEdit();
    } catch {
      toast({ title: 'Error', description: 'Failed to update member.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={ELEVATED_SECTION}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Membership Details</h2>
          </div>
          {!readOnly && !editing && (
            <SectionEditButton onClick={openEdit} disabled={editDisabled} />
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Membership Plan */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Membership Plan <span className="text-destructive">*</span></p>
                <Select
                  value={form.membership_structure_id}
                  onValueChange={(v) => setField({ membership_structure_id: v, membership_tier_id: '' })}
                >
                  <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {structures.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Membership Tier — only when the plan has tiers */}
              {showTiers && (
                <div>
                  <LabelWithHelp label="Membership Tier" />
                  <Select value={form.membership_tier_id} onValueChange={(v) => setField({ membership_tier_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                    <SelectContent>
                      {(selectedStructure?.tiers || []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Membership Status */}
              <div>
                <LabelWithHelp label="Membership Status" />
                <Select value={form.status} onValueChange={(v) => setField({ status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEMBER_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Joined Date + Expiration Date on the same row */}
              <div>
                <LabelWithHelp label="Start Date" help="Membership commencement date. Can be updated manually by an admin" />
                <DateField value={form.start_date} onChange={(v) => setField({ start_date: v })} />
              </div>
              <div>
                <LabelWithHelp label="Expiration Date" help="Auto-updated based on membership plan configuration" /><Input
                  value={isLifetime ? 'Never' : fmtDate(form.expiration_date)}
                  disabled
                  className="bg-muted text-muted-foreground" />
              </div>

              {/* Renewal Period (read-only, from plan) */}
              <div>
                <LabelWithHelp label="Renewal Period" help="Auto-updated based on membership plan configuration" />
                <Input value={renewalDisplay(selectedStructure)} disabled className="bg-muted text-muted-foreground" />
              </div>

              {/* Membership Fees (read-only, from plan/tier) */}
              <div>
                <LabelWithHelp label="Membership Fees" help="Auto-updated based on membership plan configuration" />
                <Input value={feeDisplay(selectedStructure, selectedTier)} disabled className="bg-muted text-muted-foreground" />
              </div>

              {/* Payment Status */}
              <div>
                <LabelWithHelp label="Payment Status" help="Updated by an admin after payment verification" />
                <Select value={form.payment_status} onValueChange={(v) => setField({ payment_status: v })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div>
                <LabelWithHelp label="Payment Method" help="Member's preferred payment method. Can be updated manually by an admin" />
                <Select value={form.payment_method} onValueChange={(v) => setField({ payment_method: v })}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Type — parallel to Payment Method, online payments only */}
              {form.payment_method === 'Online Payment' && (
                <div>
                  <LabelWithHelp label="Payment Type" help="Updated manually by an admin" />
                  <Select value={form.online_payment_type} onValueChange={(v) => setField({ online_payment_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select payment type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time Payment</SelectItem>
                      <SelectItem value="recurrent">Recurrent Payment</SelectItem>
                    </SelectContent>
                  </Select>
                  {onlinePaymentGuide(form.online_payment_type) && (
                    <p className="text-xs text-muted-foreground mt-1.5">{onlinePaymentGuide(form.online_payment_type)}</p>
                  )}
                </div>
              )}
            </div>

            {isLifetime && <p className="text-xs text-muted-foreground">Lifetime membership — never expires.</p>}
            <CardEditFooter onCancel={onCloseEdit} onSave={handleSave} saving={saving} />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-5 gap-y-5">
              <ReadField label="Membership Plan">
                <span className="font-medium">{resolveStructureName(member, structures)}</span>
              </ReadField>
              {resolveTierName(member, structures) && (
                <ReadField label="Membership Tier">
                  <span className="font-medium">{resolveTierName(member, structures)}</span>
                </ReadField>
              )}
              <ReadField label="Membership Status"><StatusBadge status={member.status} /></ReadField>
              <ReadField label="Start Date" help="Membership commencement date. Can be updated manually by an admin">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {fmtDate(member.start_date)}
                </span>
              </ReadField>
              <ReadField label="Expiration Date" help="Auto-updated based on membership plan configuration">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {member.expiration_date ? fmtDate(member.expiration_date) : 'Never'}
                </span>
              </ReadField>
              <ReadField label="Renewal Period" help="Auto-updated based on membership plan configuration">
                {renewalDisplay(selectedStructure)}
              </ReadField>
              <ReadField label="Membership Fees" help="Auto-updated based on membership plan configuration">
                {feeDisplay(selectedStructure, selectedTier)}
              </ReadField>
              <ReadField label="Payment Status" help="Updated by an admin after payment verification">
                <PaymentStatusBadge status={member.payment_status} />
              </ReadField>
              <ReadField label="Payment Method" help="Member's preferred payment method. Can be updated manually by an admin">
                <span>{member.payment_method || '–'}</span>
              </ReadField>
              {member.payment_method === 'Online Payment' && (
                <ReadField label="Payment Type" help="Updated manually by an admin">
                  <span>{ONLINE_PAYMENT_TYPE_LABELS[member.online_payment_type] || '–'}</span>
                  {onlinePaymentGuide(member.online_payment_type) && (
                    <p className="text-xs text-muted-foreground mt-1">{onlinePaymentGuide(member.online_payment_type)}</p>
                  )}
                </ReadField>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}