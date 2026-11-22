import { base44 } from '@/api/base44Client';

/** Overview-tab fields copied when cloning a work plan's work items. */
const COPY_FIELDS = ['title', 'description', 'category', 'due_date', 'owner', 'priority', 'frequency'];

/**
 * Copy a source work plan's field configuration and its work items into a newly
 * created plan. Notes, tasks and documents are never copied, and status resets.
 */
export async function cloneWorkPlanItems(sourcePlanId, newPlan) {
  const source = await base44.entities.WorkPlan.get(sourcePlanId);
  if (source?.config?.fields?.length) {
    await base44.entities.WorkPlan.update(newPlan.id, {
      config: { ...(newPlan.config || {}), fields: source.config.fields },
    });
  }

  const items = await base44.entities.WorkItem.filter({ work_plan_id: sourcePlanId }, 'order_index');
  if (items.length === 0) return 0;

  const payloads = items.map((item, i) => {
    const payload = {
      work_plan_id: newPlan.id,
      item_id: `ITEM-${String(i + 1).padStart(3, '0')}`,
      status: 'Not Started',
      order_index: item.order_index ?? i,
      custom_fields: item.custom_fields || {},
    };
    COPY_FIELDS.forEach((f) => { if (item[f]) payload[f] = item[f]; });
    return payload;
  });

  await base44.entities.WorkItem.bulkCreate(payloads);
  return payloads.length;
}