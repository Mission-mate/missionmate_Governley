import { base44 } from '@/api/base44Client';
import { startYearFromDate } from '@/lib/financialYear';
import { listTasks } from '@/lib/obligationTasks';

const OBLIGATION_FIELDS = ['title', 'description', 'category', 'regulator', 'owner', 'frequency', 'priority'];
const TASK_FIELDS = ['title', 'owner_name', 'due_date', 'description'];

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * Shift an ISO date's year by `offset`, keeping day and month.
 * 29 Feb lands on 28 Feb when the target year is not a leap year.
 */
export function shiftIsoYear(iso, offset) {
  if (!iso || !offset) return iso || null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map((n) => parseInt(n, 10));
  if ([y, m, d].some(Number.isNaN)) return iso;
  const ny = y + offset;
  const nd = m === 2 && d === 29 && !isLeap(ny) ? 28 : d;
  return `${ny}-${String(m).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
}

/**
 * Copy a source compliance register's field config, obligations and tasks into
 * a newly created register. Statuses reset to Not Started; dates shift by the
 * difference between the two registers' period start years.
 * Returns { obligations, tasks } counts.
 */
export async function cloneComplianceRegister(sourceId, newRegister) {
  const source = await base44.entities.ComplianceRegister.get(sourceId);
  if (source?.config?.fields?.length) {
    await base44.entities.ComplianceRegister.update(newRegister.id, {
      config: { ...(newRegister.config || {}), fields: source.config.fields },
    });
  }

  const offset =
    (startYearFromDate(newRegister.financial_year_start) ?? 0) -
    (startYearFromDate(source?.financial_year_start) ?? 0);

  const obligations = await base44.entities.ComplianceObligation.filter({ register_id: sourceId }, 'order_index');
  if (obligations.length === 0) return { obligations: 0, tasks: 0 };

  const created = await Promise.all(
    obligations.map((o, i) => {
      const payload = {
        register_id: newRegister.id,
        obligation_id: `OBL-${String(i + 1).padStart(3, '0')}`,
        status: 'Not Started',
        register_status: 'active',
        order_index: o.order_index ?? i,
        custom_fields: o.custom_fields || {},
        due_date: shiftIsoYear(o.due_date, offset),
      };
      OBLIGATION_FIELDS.forEach((f) => { if (o[f]) payload[f] = o[f]; });
      return base44.entities.ComplianceObligation.create(payload);
    })
  );

  // Copy each obligation's checklist items.
  let taskCount = 0;
  for (let idx = 0; idx < obligations.length; idx += 1) {
    const from = { type: 'compliance_obligation', id: obligations[idx].id };
    const to = { parent_type: 'compliance_obligation', parent_id: created[idx].id };
    const tasks = await listTasks(from);
    const taskPayloads = tasks.map((t) => {
      const payload = { ...to, status: 'Not Started', order_index: t.order_index ?? 0 };
      TASK_FIELDS.forEach((f) => { if (t[f]) payload[f] = t[f]; });
      if (payload.due_date) payload.due_date = shiftIsoYear(payload.due_date, offset);
      return payload;
    });
    if (taskPayloads.length) await base44.entities.ObligationTask.bulkCreate(taskPayloads);
    taskCount += taskPayloads.length;
  }

  return { obligations: created.length, tasks: taskCount };
}