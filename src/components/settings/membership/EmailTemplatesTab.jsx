import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import SectionEditButton from '@/components/shared/SectionEditButton';
import { LoaderOne } from '@/components/ui/loaders';
import { cn } from '@/lib/utils';
import Collapse from '@/components/shared/Collapse';
import { getAppConfig, saveAppConfig } from '@/lib/appConfig';
import {
  EMAIL_TEMPLATES_CONFIG_KEY,
  EMAIL_TEMPLATE_DEFS,
  buildTemplateState,
} from '@/lib/emailTemplates';
import EmailTemplateEditor from './email/EmailTemplateEditor';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';

export default function EmailTemplatesTab() {
  const [record, setRecord] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [openId, setOpenId] = useState('welcome');
  const [editingId, setEditingId] = useState(null);
  const recordRef = useRef(null);
  const saveTimer = useRef(null);
  const pendingRef = useRef(null);
  const leave = usePageLeaveGuard('email template changes');

  const persist = async (nextTemplates) => {
    pendingRef.current = null;
    const current = recordRef.current;
    const nextSettings = { ...(current?.settings || {}), ...nextTemplates };
    const saved = await saveAppConfig(EMAIL_TEMPLATES_CONFIG_KEY, nextSettings, current);
    recordRef.current = saved;
    setRecord(saved);
  };

  useEffect(() => {
    (async () => {
      const rec = await getAppConfig(EMAIL_TEMPLATES_CONFIG_KEY);
      setRecord(rec);
      recordRef.current = rec;
      setTemplates(buildTemplateState(rec?.settings));
    })();
    // Leaving the tab mid-debounce flushes the committed change instead of dropping it.
    return () => {
      clearTimeout(saveTimer.current);
      if (pendingRef.current) persist(pendingRef.current);
    };
  }, []);

  if (!templates) {
    return (
      <div className="py-12 flex justify-center">
        <LoaderOne />
      </div>
    );
  }

  // Debounced autosave — persists the full template set shortly after edits stop.
  const scheduleSave = (nextTemplates) => {
    clearTimeout(saveTimer.current);
    pendingRef.current = nextTemplates;
    saveTimer.current = setTimeout(() => persist(nextTemplates), 700);
  };

  const updateTemplate = (id, next) => {
    setTemplates((t) => {
      const updated = { ...t, [id]: next };
      scheduleSave(updated);
      return updated;
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 max-w-6xl">
      {leave.dialog}
      <h2 className="text-xl font-bold text-foreground">Email Templates</h2>
      <p className="text-sm text-muted-foreground mb-6">Configure the automated emails sent to members.</p>

      <div className="space-y-3">
        {EMAIL_TEMPLATE_DEFS.map((def) => {
          const open = openId === def.id;
          return (
            <div key={def.id} className="rounded-xl bg-muted/40 px-4">
              <div className="flex items-center justify-between py-4 gap-3">
                <button
                  type="button"
                  onClick={() => leave.guard(() => { setOpenId(open ? null : def.id); setEditingId(null); })}
                  className="flex-1 text-left"
                >
                  <p className="text-base font-bold text-foreground">{def.title}</p>
                  {open && <p className="text-xs text-muted-foreground mt-0.5">{def.subtitle}</p>}
                </button>
                {open && editingId !== def.id && (
                  <SectionEditButton onClick={() => setEditingId(def.id)} className="mr-0" />
                )}
                <button type="button" onClick={() => leave.guard(() => { setOpenId(open ? null : def.id); setEditingId(null); })}>
                  <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
                </button>
              </div>
              <Collapse open={open}>{(cls) => (
                <div className={cn(cls, 'pb-5')}>
                  <EmailTemplateEditor
                    def={def}
                    template={templates[def.id]}
                    editing={editingId === def.id}
                    onDone={() => setEditingId(null)}
                    onChange={(next) => updateTemplate(def.id, next)}
                  />
                </div>
              )}</Collapse>
            </div>
          );
        })}
      </div>
    </div>
  );
}