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
import { CheckCircle2, Lightbulb } from 'lucide-react';

export default function IdeaForm({ onDone }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', category: 'Feature', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  useDirtyFlag(!success && !submitting && (!!form.title.trim() || !!form.description.trim()));

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    await base44.entities.Idea.create({
      ...form,
      status: 'submitted',
      votes: 0,
      submitter_name: user?.full_name || '',
    });
    setSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-3">
        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-yellow-600" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Idea submitted</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Thanks for sharing! We review every idea and use them to shape the roadmap.
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
        <div className="w-9 h-9 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
          <Lightbulb className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Submit an Idea</h3>
          <p className="text-xs text-muted-foreground">Help us build what matters to you</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Idea title</Label>
        <Input
          placeholder="A short, descriptive title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Category</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Feature">Feature</SelectItem>
            <SelectItem value="Improvement">Improvement</SelectItem>
            <SelectItem value="Integration">Integration</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          placeholder="Describe your idea and the problem it solves..."
          rows={6}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <Button className="w-full" disabled={!form.title.trim() || submitting} onClick={handleSubmit}>
        {submitting ? 'Submitting...' : 'Submit Idea'}
      </Button>
    </div>
  );
}