import { base44 } from '@/api/base44Client';
import { createWorkItem, nextItemId, monthEndDate, dueMonthName } from '@/lib/workPlanApi';

// ── Folder CRUD ──────────────────────────────────────────────────────────────
export function listTemplateFolders() {
  return base44.entities.WorkPlanTemplateFolder.filter({}, 'order_index');
}

export function createTemplateFolder(name, color = 'orange') {
  return base44.entities.WorkPlanTemplateFolder.create({ name: name.trim(), color, order_index: Date.now() });
}

export function updateTemplateFolder(id, { name, color }) {
  const patch = {};
  if (name != null) patch.name = name.trim();
  if (color != null) patch.color = color;
  return base44.entities.WorkPlanTemplateFolder.update(id, patch);
}

export async function deleteTemplateFolder(id) {
  const items = await base44.entities.WorkPlanTemplateItem.filter({ folder_id: id });
  await Promise.all(items.map((i) => base44.entities.WorkPlanTemplateItem.delete(i.id)));
  return base44.entities.WorkPlanTemplateFolder.delete(id);
}

// ── Library item CRUD ────────────────────────────────────────────────────────
export function listTemplateItems(folderId) {
  return base44.entities.WorkPlanTemplateItem.filter({ folder_id: folderId }, 'order_index');
}

export function deleteTemplateItem(id) {
  return base44.entities.WorkPlanTemplateItem.delete(id);
}

/**
 * Save an existing work item into a library folder. Status is never stored —
 * applied items always default to Not Started.
 */
export function saveItemToTemplate(folderId, item) {
  const originId = item.template_origin_id || `orig-${item.id || Date.now()}`;
  return base44.entities.WorkPlanTemplateItem.create({
    folder_id: folderId,
    template_origin_id: originId,
    title: item.title || '',
    description: item.description || '',
    category: item.category || '',
    owner: item.owner || '',
    frequency: item.frequency || '',
    priority: item.priority || '',
    target_month: dueMonthName(item.due_date),
    order_index: Date.now(),
  });
}

/** Add a library item to a work plan. Status defaults to Not Started. */
export function applyTemplateToRegister(template, workPlan, existingItems) {
  const data = {
    item_id: nextItemId(existingItems),
    template_origin_id: template.template_origin_id || '',
    status: 'Not Started',
  };
  data.title = template.title || '';
  if (template.description) data.description = template.description;
  if (template.category) data.category = template.category;
  if (template.owner) data.owner = template.owner;
  if (template.frequency) data.frequency = template.frequency;
  if (template.priority) data.priority = template.priority;
  // Library items are plan-agnostic months — land on that month's last day in this plan.
  const due = monthEndDate(template.target_month, workPlan);
  if (due) data.due_date = due;
  return createWorkItem(workPlan.id, data);
}

/** Whether a library item is already present in the work plan. */
export function isTemplateInRegister(template, workItems) {
  const origin = template.template_origin_id;
  if (origin) return workItems.some((o) => o.template_origin_id === origin);
  const key = (template.title || '').trim().toLowerCase();
  if (!key) return false;
  return workItems.some((o) => (o.title || '').trim().toLowerCase() === key);
}