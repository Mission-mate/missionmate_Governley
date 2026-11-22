import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import React from 'react';
import Collapse from '@/components/shared/Collapse';
import { overdueLabel } from '@/lib/overdueLabel';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { getTemplate } from '@/lib/complianceRegisterTemplates';
import { formatReviewDate, isOverdue } from '@/lib/complianceRegisters';
import CircleCheck from '@/components/shared/CircleCheck';
import { COMPLIANCE_TABLE } from '@/components/compliance/complianceSurfaces';

function StatusBadge({ register }) {
  const archived = register.status === 'archived';
  const cls = archived
    ? 'bg-muted text-muted-foreground'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300';
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      {archived ? 'Archived' : 'Active'}
    </span>
  );
}

function NextReviewCell({ register }) {
  const overdue = isOverdue(register);
  return (
    <div>
      <span className={`text-sm ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground/80'}`}>
        {formatReviewDate(register.next_review_date)}
      </span>
      {overdue && <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{overdueLabel(register.next_review_date)}</p>}
    </div>
  );
}

export default function RegisterTable({
  categories, registers, collapsed, onToggleCategory, selectedIds = [], onToggleSelect,
}) {
  const navigate = useNavigate();
  const openRegister = (reg) => navigate(`/compliance/registers/${reg.id}`);

  return (
    <div className={`${COMPLIANCE_TABLE} overflow-hidden`}>
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-secondary/40 border-b border-border text-left">
            <th className="py-3 pl-4 pr-0 w-12" />
            <th className="py-3 px-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle w-[30%]">Register Title</th>
            <th className="py-3 px-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle w-[18%]">Owner</th>
            <th className="py-3 px-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle w-[14%]">Review Frequency</th>
            <th className="py-3 px-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle w-[14%]">Last Review Date</th>
            <th className="py-3 px-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle w-[14%]">Next Review Date</th>
            <th className="py-3 px-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide align-middle w-[10%]">Status</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const catRegisters = registers.filter((r) => (r.category || '') === cat);
            return (
              <React.Fragment key={cat}>
                <tr
                  className="border-b border-border/60 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onToggleCategory(cat)}
                >
                  <td colSpan={7} className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--sidebar-foreground))]">{cat}</span>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {catRegisters.length}
                      </span>
                    </div>
                  </td>
                </tr>
                <Collapse open={!collapsed[cat]}>{(cls) => catRegisters.map((reg) => {
                  const selected = selectedIds.includes(reg.id);
                  const Icon = getTemplate(reg.register_type)?.icon || FileText;
                  return (
                    <tr
                      key={reg.id}
                      className={`${cls} border-b border-border/40 transition-colors ${selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70'}`}
                    >
                      <td className="py-3 pl-4 pr-0">
                        <CircleCheck checked={selected} onChange={() => onToggleSelect(reg.id)} />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                          </span>
                          <button
                            onClick={() => openRegister(reg)}
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left"
                          >
                            {reg.title}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-foreground/80">
                        {reg.owner ? (
                          <span className="flex items-center gap-2 min-w-0">
                            <PersonInitialsAvatar name={reg.owner} className="h-7 w-7 text-[11px]" />
                            <span className="truncate">{reg.owner}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3 text-sm text-foreground/80">{reg.review_frequency || '—'}</td>
                      <td className="py-3 px-3 text-sm text-foreground/80">{formatReviewDate(reg.last_review_date)}</td>
                      <td className="py-3 px-3"><NextReviewCell register={reg} /></td>
                      <td className="py-3 px-3"><StatusBadge register={reg} /></td>
                    </tr>
                  );
                })}</Collapse>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}