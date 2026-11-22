import React, { useState } from 'react';
import useDirtyFlag from '@/hooks/useDirtyFlag';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Ticket } from 'lucide-react';

export default function TicketForm({ onDone }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    subject: '',
    category: 'Other',
    priority: 'Medium',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  useDirtyFlag(!success && !submitting && (!!form.subject.trim() || !!form.description.trim()));

  const handleSubmit = async () => {
    if (!form.subject.trim()) return;
    setSubmitting(true);
    await base44.entities.SupportTicket.create({
      ...form,
      status: 'open',
      submitter_name: user?.full_name || '',
      submitter_email: user?.email || '',
    });
    setSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Ticket submitted</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Thanks! Our team will review your ticket and get back to you shortly.
        </p>
        <Button variant="outline" className="mt-2" onClick={onDone}>
          Back to Help
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
          <Ticket className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Raise a Ticket</h3>
          <p className="text-xs text-muted-foreground">We'll get back to you by email</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Subject</Label>
        <Input
          placeholder="Brief summary of the issue"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Technical Issue">Technical Issue</SelectItem>
              <SelectItem value="Billing">Billing</SelectItem>
              <SelectItem value="Feature Request">Feature Request</SelectItem>
              <SelectItem value="Account">Account</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          placeholder="Describe what's happening, including any steps to reproduce..."
          rows={6}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <Button className="w-full" disabled={!form.subject.trim() || submitting} onClick={handleSubmit}>
        {submitting ? 'Submitting...' : 'Submit Ticket'}
      </Button>
    </div>
  );
}