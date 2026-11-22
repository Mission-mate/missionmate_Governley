import { format, parseISO, isValid, addMonths, addYears, differenceInCalendarDays } from 'date-fns';
import { toIdOptions, toCustomColumns } from '@/lib/configNormalize';
import { localNow } from '@/lib/localClock';

/** Asset Register — shared constants, per-register option config and derived helpers. */

export const ASSET_STATUS_OPTIONS = [{ name: 'Active', color: 'green' }, { name: 'Disposed', color: 'red' }];
export const CONDITION_OPTIONS = [{ name: 'Good', color: 'green' }, { name: 'Fair', color: 'orange' }, { name: 'Poor', color: 'red' }];
export const OWNERSHIP_OPTIONS = [{ name: 'Owned', color: 'blue' }, { name: 'Leased', color: 'purple' }];
export const DEPRECIATION_METHODS = ['No Depreciation', 'Straight Line', 'Reducing Balance', 'Write-off'].map((name) => ({ name }));
export const CALCULATION_METHODS = ['Depreciation Rate', 'Effective Life'].map((name) => ({ name }));
export const LIFE_UNITS = ['Months', 'Years'].map((name) => ({ name }));

export const optionId = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_ASSET_TYPES = ['IT Equipment', 'Furniture', 'Vehicles'].map((name, i) => ({ id: `type-${i + 1}`, name }));
const DEFAULT_LOCATIONS = ['Head Office', 'Warehouse'].map((name, i) => ({ id: `loc-${i + 1}`, name }));

/** Seed config written onto a new Asset Register. */
export function defaultAssetConfig() {
  return { asset_types: DEFAULT_ASSET_TYPES, locations: DEFAULT_LOCATIONS };
}

/** Per-register option lists, falling back to the defaults for older registers. */
export function getAssetOptions(register) {
  const c = register?.config || {};
  return {
    asset_types: toIdOptions(c.asset_types, DEFAULT_ASSET_TYPES),
    locations: toIdOptions(c.locations, DEFAULT_LOCATIONS),
  };
}

/** Custom column definitions for a register: [{ id, title, type, config }]. */
export function getAssetCustomColumns(register, key = 'custom_columns') {
  return toCustomColumns(register?.config?.[key]);
}

/** Custom columns the user switched on (eye icon) for table display; hidden by default. */
export const tableVisibleColumns = (cols) => cols.filter((c) => c.table_visible === true);

export const isDepreciating = (method) => method === 'Straight Line' || method === 'Reducing Balance';

export function calcDepreciationEnd(a) {
  if (!isDepreciating(a.depreciation_method) || !a.depreciation_start_date) return null;
  const start = parseISO(a.depreciation_start_date);
  if (!isValid(start)) return null;
  let end = null;
  if (a.calculation_method === 'Effective Life') {
    const n = Number(a.effective_life_value);
    if (!(n > 0)) return null;
    end = a.effective_life_unit === 'Months' ? addMonths(start, n) : addYears(start, n);
  } else if (a.calculation_method === 'Depreciation Rate') {
    const r = Number(a.depreciation_rate);
    if (!(r > 0)) return null;
    end = addYears(start, Math.ceil(100 / r));
  }
  return end ? format(end, 'yyyy-MM-dd') : null;
}

export function nextAssetId(items) {
  const max = items.reduce((m, it) => {
    const match = /^AST-(\d+)$/i.exec(it.asset_id || '');
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `AST-${String(max + 1).padStart(3, '0')}`;
}

export function isWarrantyExpired(a) {
  if (a.status !== 'Active' || !a.warranty_expiry) return false;
  return differenceInCalendarDays(parseISO(a.warranty_expiry), localNow()) < 0;
}

export function assetErrors(a) {
  const e = {};
  if (!(a.asset_id || '').trim()) e.asset_id = 'Asset ID is required.';
  if (!(a.title || '').trim()) e.title = 'Asset title is required.';
  if (isDepreciating(a.depreciation_method)) {
    if (a.calculation_method === 'Depreciation Rate' && a.depreciation_rate !== '' && a.depreciation_rate != null) {
      const r = Number(a.depreciation_rate);
      if (isNaN(r) || r <= 0 || r > 100) e.depreciation_rate = 'Depreciation rate must be a number between 0 and 100.';
    }
    if (a.calculation_method === 'Effective Life' && a.effective_life_value !== '' && a.effective_life_value != null) {
      const n = Number(a.effective_life_value);
      if (isNaN(n) || n <= 0) e.effective_life_value = 'Effective life must be a number greater than 0.';
    }
  }
  return e;
}

export function emptyAsset() {
  return {
    asset_id: '', title: '', serial_number: '', description: '', asset_type: '', location: '',
    ownership: '', purchase_date: '', lease_start_date: '', lease_end_date: '', status: 'Active', condition: '',
  };
}

const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));
const str = (v) => (v == null ? '' : String(v).trim());

/** Picks and cleans the stored asset fields from a form / draft. */
export function normaliseAsset(f) {
  return {
    asset_id: str(f.asset_id),
    title: str(f.title),
    serial_number: str(f.serial_number),
    description: f.description || '',
    asset_type: f.asset_type || '',
    location: f.location || '',
    ownership: f.ownership || '',
    purchase_date: f.purchase_date || null,
    lease_start_date: f.lease_start_date || null,
    lease_end_date: f.lease_end_date || null,
    status: f.status || 'Active',
    condition: f.condition || '',
    asset_value: num(f.asset_value),
    warranty_expiry: f.warranty_expiry || null,
    asset_manager: str(f.asset_manager),
    asset_user: str(f.asset_user),
    date_of_disposal: f.date_of_disposal || null,
    sale_proceeds: num(f.sale_proceeds),
    depreciation_method: f.depreciation_method || '',
    depreciation_start_date: f.depreciation_start_date || null,
    calculation_method: f.calculation_method || '',
    depreciation_rate: num(f.depreciation_rate),
    effective_life_value: num(f.effective_life_value),
    effective_life_unit: f.effective_life_unit || '',
    depreciation_end_date: calcDepreciationEnd(f),
    custom_fields: f.custom_fields && typeof f.custom_fields === 'object' ? f.custom_fields : {},
  };
}

export function fmtDate(d) {
  if (!d) return '';
  const p = parseISO(d);
  return isValid(p) ? format(p, 'd MMM yyyy') : '';
}

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
export const fmtMoney = (n) => (n == null || n === '' ? '' : money.format(Number(n)));