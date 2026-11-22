import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import RichTextField from '@/components/shared/RichTextField';
import { EMAIL_TEMPLATE_VARIABLES } from '@/lib/emailTemplates';
import useDirtyFlag from '@/hooks/useDirtyFlag';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';

/**
 * A single email template. Opens read-only; the Edit button switches to an
 * editable draft that is only committed to the parent on Save Changes.
 */
export default function EmailTemplateEditor({ def, template, onChange, editing = false, onDone }) {
  const [draft, setDraft] = useState(template);

  useEffect(() => { setDraft(template); }, [template]);
  useDirtyFlag(editing && !draftEqual(draft, template));

  const insertVariable = (variable) => {
    const ok = document.queryCommandSupported && document.execCommand('insertText', false, variable);
    if (ok) return;
    setDraft({ ...draft, body: (draft.body || '') + variable });
  };

  const cancel = () => { setDraft(template); onDone?.(); };
  const save = () => { onChange(draft); onDone?.(); };

  const shown = editing ? draft : template;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
      {/* Editor / read-only fields */}
      <div className="space-y-4">
        <div>
          <Label className="mb-1.5 block text-sm font-semibold text-foreground">Email Subject</Label>
          <Input
            value={shown.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            placeholder="Email subject"
            disabled={!editing}
            className="bg-card"
          />
        </div>

        <div>
          <Label className="mb-1 block text-sm font-semibold text-foreground">Email Body</Label>
          {editing && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-xs text-muted-foreground mr-1">Available variables:</span>
              {EMAIL_TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertVariable(v); }}
                  className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {editing ? (
            <RichTextField
              value={draft.body}
              onChange={(html) => setDraft({ ...draft, body: html })}
              placeholder="Write the email body..."
              minHeight={240}
            />
          ) : (
            <div
              className="rounded-lg border border-border bg-card p-3 min-h-[240px] text-sm text-foreground leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_a]:text-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: template.body || '—' }}
            />
          )}
        </div>

        {editing && (
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancel}>
              Cancel
            </Button>
            <Button type="button" onClick={save}>Save Changes</Button>
          </div>
        )}
      </div>

      {/* Live preview */}
      <div className="rounded-xl bg-card border border-border p-4 h-fit">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">Live Preview</span>
          <span className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground">
            {def.title}
          </span>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Subject</p>
          <p className="text-sm font-semibold text-foreground mb-3">{shown.subject || '—'}</p>
          <div
            className="text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_a]:text-primary [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: shown.body || '—' }}
          />
        </div>
      </div>
    </div>
  );
}