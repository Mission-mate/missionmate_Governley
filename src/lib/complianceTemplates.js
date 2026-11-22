import { base44 } from '@/api/base44Client';
import { startYearFromDate, PERIOD_CALENDAR } from '@/lib/financialYear';
import { createObligation, nextObligationId } from '@/lib/complianceApi';

// ── Folder CRUD ───────────────────────────────────────────────────────────────
export function listTemplateFolders() {
  return base44.entities.ComplianceTemplateFolder.filter({}, 'order_index');
}

export function createTemplateFolder(name, color = 'orange') {
  return base44.entities.ComplianceTemplateFolder.create({ name: name.trim(), color, order_index: Date.now() });
}

export function updateTemplateFolder(id, { name, color }) {
  const patch = {};
  if (name != null) patch.name = name.trim();
  if (color != null) patch.color = color;
  return base44.entities.ComplianceTemplateFolder.update(id, patch);
}

export async function deleteTemplateFolder(id) {
  // cascade delete template obligations inside the folder
  const items = await base44.entities.ComplianceTemplateObligation.filter({ folder_id: id });
  await Promise.all(items.map((i) => base44.entities.ComplianceTemplateObligation.delete(i.id)));
  return base44.entities.ComplianceTemplateFolder.delete(id);
}

// ── Template obligation CRUD ──────────────────────────────────────────────────
export function listTemplateObligations(folderId) {
  return base44.entities.ComplianceTemplateObligation.filter({ folder_id: folderId }, 'order_index');
}

export function deleteTemplateObligation(id) {
  return base44.entities.ComplianceTemplateObligation.delete(id);
}

/** Extract MM-DD from an ISO date string (YYYY-MM-DD). */
function toMonthDay(isoDate) {
  if (!isoDate) return '';
  const parts = String(isoDate).split('-');
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : '';
}

/**
 * Save an existing obligation into a template folder.
 * Only stores the core fields (title, description, category, regulator, owner,
 * frequency, priority) plus the due date's month-and-day. Status is never stored
 * (applied obligations always default to Not Started).
 */
export function saveObligationToTemplate(folderId, obligation) {
  // Stable identity that links the template item back to its source obligation,
  // so re-saving the same obligation updates the library entry instead of
  // creating a duplicate, and so registers can dedup by origin (not by ID/title).
  const originId = obligation.template_origin_id || `orig-${obligation.id || Date.now()}`;
  return base44.entities.ComplianceTemplateObligation.create({
    folder_id: folderId,
    template_origin_id: originId,
    title: obligation.title || '',
    description: obligation.description || '',
    category: obligation.category || '',
    regulator: obligation.regulator || '',
    owner: obligation.owner || '',
    frequency: obligation.frequency || '',
    priority: obligation.priority || '',
    due_month_day: toMonthDay(obligation.due_date),
    order_index: Date.now(),
  });
}

/**
 * Re-map a template's MM-DD to the correct ISO date for a target register,
 * respecting the register's Reporting Year. Financial Year (Jul–Jun): months
 * Jul–Dec use the start year, months Jan–Jun use the following year.
 * Calendar Year (Jan–Dec): every month uses the start year.
 */
export function resolveTemplateDueDate(monthDay, register) {
  if (!monthDay) return '';
  const startYear = startYearFromDate(register.financial_year_start);
  if (!startYear) return '';
  if (register.compliance_period_type === PERIOD_CALENDAR) return `${startYear}-${monthDay}`;
  const month = parseInt(monthDay.split('-')[0], 10);
  return `${month <= 6 ? startYear + 1 : startYear}-${monthDay}`;
}

/**
 * Add a template obligation to a compliance register. Only non-empty template
 * fields are written. Status defaults to Not Started; the due date year is
 * re-mapped to the register's compliance period.
 */
export function applyTemplateToRegister(template, register, existingObligations) {
  const data = {
    obligation_id: nextObligationId(existingObligations),
    template_origin_id: template.template_origin_id || '',
    status: 'Not Started',
  };
  data.title = template.title || '';
  if (template.description) data.description = template.description;
  if (template.category) data.category = template.category;
  if (template.regulator) data.regulator = template.regulator;
  if (template.owner) data.owner = template.owner;
  if (template.frequency) data.frequency = template.frequency;
  if (template.priority) data.priority = template.priority;
  const due = resolveTemplateDueDate(template.due_month_day, register);
  if (due) data.due_date = due;
  return createObligation(register.id, data);
}

/**
 * Determine whether a template obligation is already present in the register.
 * Matched by the stable template_origin_id so the same template item can't be
 * added to the same register twice — but the same auto-generated obligation_id
 * (e.g. OBL-001) across different registers never triggers a false match.
 * Falls back to title match for legacy items saved without an origin id.
 */
export function isTemplateInRegister(template, registerObligations) {
  const origin = template.template_origin_id;
  if (origin) return registerObligations.some((o) => o.template_origin_id === origin);
  const key = (template.title || '').trim().toLowerCase();
  if (!key) return false;
  return registerObligations.some((o) => (o.title || '').trim().toLowerCase() === key);
}