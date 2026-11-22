/**
 * Base44-compatible entity API on top of Supabase (PostgREST).
 *
 * The app was written against `base44.entities.<Name>.list / filter / get / create / update /
 * delete / deleteMany / updateMany / bulkCreate / bulkUpdate / count / aggregate / subscribe`.
 * This module gives the same API, so the screens and server functions keep working unchanged,
 * but the data now lives in Postgres tables.
 *
 * Plain JavaScript with no imports, so the browser app (Vite) and the edge functions (Deno)
 * share the exact same code.
 *
 * Query language: the MongoDB-style filters Base44 used ({ field: value }, $in, $nin, $ne, $gt,
 * $gte, $lt, $lte, $regex, $exists, $all, $not, $or, $and, $nor) are translated into one
 * PostgREST logic tree.
 */

const PAGE = 1000; // Supabase "Max rows" default: one request never returns more than this.
const DEFAULT_ARRAY_LIMIT = 5000; // Base44 default for list()/filter() without a limit.
const DEFAULT_PAGE_LIMIT = 100; // Base44 default for list({ ... }) cursor pages.
const MAX_PAGE_LIMIT = 5000;
const IN_CHUNK = 200; // Split very long $in lists so the request URL stays short.
const WRITE_CHUNK = 500;
const READONLY = new Set(['id', 'created_date', 'updated_date', 'created_by', 'created_by_id', '_extra']);
const TRUE = 'id.not.is.null';
const FALSE = 'id.is.null';
const SAFE_KEY = /^[A-Za-z0-9_]+$/;

// --------------------------------------------------------------------------- errors

/** Same shape as the Base44 SDK error: message, status, code, data (+ response for axios-style checks). */
export class Base44Error extends Error {
  constructor(message, status, code, data) {
    super(message);
    this.name = 'Base44Error';
    this.status = status;
    this.code = code;
    this.data = data;
    this.response = { status, data };
  }

  toJSON() {
    return { name: this.name, message: this.message, status: this.status, code: this.code, data: this.data };
  }
}

export function fromPgError(error, status) {
  const code = error?.code;
  let st = status || undefined;
  if (code === '42501') st = 403;
  else if (code === 'PGRST116') st = 404;
  else if (code === '23505') st = 409;
  else if (['22P02', '22007', '22008', '23502', '23514', 'PGRST204', '42703', 'PGRST100'].includes(code)) st = 400;
  const message = error?.message || 'The request failed';
  return new Base44Error(message, st, code, {
    message,
    error: message,
    details: error?.details,
    hint: error?.hint,
    code,
  });
}

const notFound = (entity, id) =>
  new Base44Error(`${entity} with id ${id} not found`, 404, 'NOT_FOUND', { message: 'Not found', error: 'not_found' });

// --------------------------------------------------------------------------- helpers

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

function quote(v) {
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function fmt(v) {
  if (v instanceof Date) return quote(v.toISOString());
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (isPlainObject(v) || Array.isArray(v)) return quote(JSON.stringify(v));
  return quote(v);
}

const jsonArray = (values) => quote(JSON.stringify(values.map((v) => (v instanceof Date ? v.toISOString() : v))));

function group(op, conds) {
  if (conds.length === 0) return op === 'and' ? TRUE : FALSE;
  if (conds.length === 1) return conds[0];
  return `${op}(${conds.join(',')})`;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

function encodeCursor(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

function decodeCursor(cursor) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(cursor))));
  } catch {
    throw new Base44Error('Invalid cursor', 400, 'INVALID_CURSOR', { error: 'invalid_cursor' });
  }
}

// --------------------------------------------------------------------------- columns

/** Where a field lives: a real column, a path inside a json column, or the _extra safety net. */
function colRef(meta, key) {
  if (key === 'id') return { ref: 'id', kind: 'text' };
  const kind = meta.columns[key];
  if (kind) return { ref: key, kind };
  const parts = key.split('.');
  if (parts.length > 1 && (meta.columns[parts[0]] === 'json' || meta.columns[parts[0]] === 'array')) {
    if (!parts.every((p) => SAFE_KEY.test(p))) throw new Base44Error(`Invalid field ${key}`, 400, 'INVALID_FIELD', {});
    const [base, ...rest] = parts;
    const path = rest.map((p, i) => (i === rest.length - 1 ? `->>${p}` : `->${p}`)).join('');
    return { ref: `${base}${path}`, kind: 'text' };
  }
  if (!SAFE_KEY.test(key)) throw new Base44Error(`Invalid field ${key}`, 400, 'INVALID_FIELD', {});
  return { ref: `_extra->>${key}`, kind: 'text', extra: true };
}

function coerce(kind, v) {
  if (v === null) return null;
  switch (kind) {
    case 'date':
    case 'timestamp':
      if (v === '') return null;
      if (v instanceof Date) return v.toISOString();
      return v;
    case 'number':
      if (v === '') return null;
      if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
      return v;
    case 'boolean':
      if (v === '') return null;
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    case 'text':
      if (v instanceof Date) return v.toISOString();
      return v;
    default:
      return v;
  }
}

/** Split an app record into real columns and unknown fields (stored in _extra). */
function prepareWrite(meta, data) {
  const row = {};
  const extra = {};
  let hasExtra = false;
  for (const [k, v] of Object.entries(data || {})) {
    if (v === undefined || READONLY.has(k)) continue;
    const kind = meta.columns[k];
    if (!kind) {
      if (!SAFE_KEY.test(k)) continue;
      extra[k] = v === undefined ? null : v;
      hasExtra = true;
      continue;
    }
    row[k] = coerce(kind, v);
  }
  return { row, extra: hasExtra ? extra : null };
}

/** Database row -> app record: drop empty (null) fields like Base44 did, and merge _extra back in. */
export function normalizeRecord(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === '_extra' || v === null) continue;
    out[k] = v;
  }
  if (row._extra && typeof row._extra === 'object') {
    for (const [k, v] of Object.entries(row._extra)) {
      if (v !== null && v !== undefined && !(k in out)) out[k] = v;
    }
  }
  return out;
}

// --------------------------------------------------------------------------- filters

/**
 * SQL compares against an empty (NULL) field as "unknown", and NOT(unknown) is still unknown,
 * while MongoDB treats a missing field as simply "not equal". Inside $nor / $not we therefore
 * add "field is not null" to each positive test so negation gives the MongoDB answer.
 */
const guard = (ref, cond, neg) => (neg ? `and(${ref}.not.is.null,${cond})` : cond);

function eqCond(ref, kind, v, neg = false) {
  if (v === null || v === undefined) return `${ref}.is.null`;
  if (kind === 'array') return guard(ref, Array.isArray(v) ? `${ref}.eq.${jsonArray(v)}` : `${ref}.cs.${jsonArray([v])}`, neg);
  if (kind === 'json' && (isPlainObject(v) || Array.isArray(v))) return guard(ref, `${ref}.eq.${quote(JSON.stringify(v))}`, neg);
  return guard(ref, `${ref}.eq.${fmt(v)}`, neg);
}

function neCond(ref, kind, v) {
  if (v === null || v === undefined) return `${ref}.not.is.null`;
  if (kind === 'array' && !Array.isArray(v)) return `or(${ref}.is.null,${ref}.not.cs.${jsonArray([v])})`;
  return `or(${ref}.is.null,${ref}.neq.${fmt(v)})`;
}

function inCond(ref, kind, values, neg = false) {
  const list = Array.isArray(values) ? values : [values];
  const hasNull = list.some((v) => v === null || v === undefined);
  const vals = list.filter((v) => v !== null && v !== undefined);
  const parts = [];
  if (kind === 'array') {
    for (const v of vals) parts.push(guard(ref, `${ref}.cs.${jsonArray([v])}`, neg));
  } else if (vals.length) {
    parts.push(guard(ref, `${ref}.in.(${vals.map(fmt).join(',')})`, neg));
  }
  if (hasNull) parts.push(`${ref}.is.null`);
  return group('or', parts);
}

function ninCond(ref, kind, values) {
  const list = Array.isArray(values) ? values : [values];
  const hasNull = list.some((v) => v === null || v === undefined);
  const vals = list.filter((v) => v !== null && v !== undefined);
  let inner;
  if (!vals.length) inner = null;
  else if (kind === 'array') inner = group('and', vals.map((v) => `${ref}.not.cs.${jsonArray([v])}`));
  else inner = `${ref}.not.in.(${vals.map(fmt).join(',')})`;
  if (hasNull) return inner ? `and(${ref}.not.is.null,${inner})` : `${ref}.not.is.null`;
  return inner ? `or(${ref}.is.null,${inner})` : TRUE;
}

const OPS = {
  $gt: 'gt',
  $gte: 'gte',
  $lt: 'lt',
  $lte: 'lte',
};

function fieldConds(meta, key, cond, neg = false) {
  if (cond === undefined) return [];
  const { ref, kind } = colRef(meta, key);
  if (cond === null) return [`${ref}.is.null`];
  // Base44: an array value is shorthand for "any of these values" ($in).
  if (Array.isArray(cond)) return [kind === 'array' ? eqCond(ref, kind, cond, neg) : inCond(ref, kind, cond, neg)];
  if (!isPlainObject(cond) || !Object.keys(cond).some((k) => k.startsWith('$'))) return [eqCond(ref, kind, cond, neg)];

  const out = [];
  for (const [op, v] of Object.entries(cond)) {
    if (v === undefined) continue;
    switch (op) {
      case '$eq':
        out.push(eqCond(ref, kind, v, neg));
        break;
      case '$ne':
        out.push(neCond(ref, kind, v));
        break;
      case '$in':
        out.push(inCond(ref, kind, v, neg));
        break;
      case '$nin':
        out.push(ninCond(ref, kind, v));
        break;
      case '$gt':
      case '$gte':
      case '$lt':
      case '$lte':
        out.push(v === null ? FALSE : guard(ref, `${ref}.${OPS[op]}.${fmt(v)}`, neg));
        break;
      case '$exists':
        out.push(v ? `${ref}.not.is.null` : `${ref}.is.null`);
        break;
      case '$regex': {
        const flags = typeof cond.$options === 'string' ? cond.$options : '';
        const pattern = v instanceof RegExp ? v.source : String(v);
        const insensitive = flags.includes('i') || (v instanceof RegExp && v.flags.includes('i'));
        out.push(guard(ref, `${ref}.${insensitive ? 'imatch' : 'match'}.${quote(pattern)}`, neg));
        break;
      }
      case '$options':
        break;
      case '$all':
        out.push(guard(ref, `${ref}.cs.${jsonArray(Array.isArray(v) ? v : [v])}`, neg));
        break;
      case '$not': {
        const inner = fieldConds(meta, key, v, true);
        // inner is guarded, so this is true for a missing field, like MongoDB's $not.
        out.push(`not.and(${inner.length ? inner.join(',') : TRUE})`);
        break;
      }
      default:
        throw new Base44Error(`Query operator ${op} is not supported`, 400, 'UNSUPPORTED_OPERATOR', { error: op });
    }
  }
  return out;
}

/** neg = true when this part sits under a $nor / $not, where empty fields need guarding. */
export function queryConds(meta, query, neg = false) {
  const out = [];
  if (!query) return out;
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (k === '$or') {
      if (!Array.isArray(v) || !v.length) continue;
      out.push(group('or', v.map((q) => group('and', queryConds(meta, q, neg)))));
    } else if (k === '$and') {
      for (const q of v || []) out.push(...queryConds(meta, q, neg));
    } else if (k === '$nor') {
      if (!Array.isArray(v) || !v.length) continue;
      // Never "unknown" (its parts are guarded), so it is also safe inside another negation.
      out.push(`not.or(${v.map((q) => group('and', queryConds(meta, q, true))).join(',')})`);
    } else {
      out.push(...fieldConds(meta, k, v, neg));
    }
  }
  return out;
}

/** The whole query as a single PostgREST "or" parameter value, or null for "match everything". */
export function queryToLogicTree(meta, query) {
  const conds = queryConds(meta, query);
  if (!conds.length) return null;
  return `and(${conds.join(',')})`;
}

function applyQuery(builder, meta, query, { requireFilter = false } = {}) {
  const tree = queryToLogicTree(meta, query);
  if (tree) return builder.or(tree);
  // Supabase blocks UPDATE/DELETE without a WHERE clause; "id is not null" matches every row.
  return requireFilter ? builder.not('id', 'is', null) : builder;
}

/** A top-level `$in` (or array shorthand) on a plain column that is too long for one URL. */
function bigInSplit(meta, query) {
  if (!query) return null;
  for (const [k, v] of Object.entries(query)) {
    if (k.startsWith('$')) continue;
    const kind = k === 'id' ? 'text' : meta.columns[k];
    if (!kind || kind === 'array') continue;
    const list = Array.isArray(v) ? v : isPlainObject(v) && Array.isArray(v.$in) && Object.keys(v).length === 1 ? v.$in : null;
    if (list && list.length > IN_CHUNK) {
      return chunk(list, IN_CHUNK).map((part) => ({ ...query, [k]: { $in: part } }));
    }
  }
  return null;
}

// --------------------------------------------------------------------------- sorting

function parseSort(sort) {
  if (!sort || typeof sort !== 'string' || !sort.trim()) return [{ key: 'created_date', desc: true }];
  return sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s[0] === '-' ? { key: s.slice(1), desc: true } : { key: s[0] === '+' ? s.slice(1) : s, desc: false }));
}

function applySort(builder, meta, sort) {
  const specs = parseSort(sort);
  for (const { key, desc } of specs) {
    const { ref } = colRef(meta, key);
    // MongoDB puts empty values first when sorting up and last when sorting down.
    builder = builder.order(ref, { ascending: !desc, nullsFirst: !desc });
  }
  if (!specs.some((s) => s.key === 'id')) builder = builder.order('id', { ascending: true });
  return builder;
}

function compareForSort(specs) {
  return (a, b) => {
    for (const { key, desc } of specs) {
      const av = a[key];
      const bv = b[key];
      const an = av === undefined || av === null;
      const bn = bv === undefined || bv === null;
      if (an && bn) continue;
      if (an) return desc ? 1 : -1;
      if (bn) return desc ? -1 : 1;
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
    }
    return String(a.id).localeCompare(String(b.id));
  };
}

function selectList(meta, fields) {
  if (!fields || (Array.isArray(fields) && !fields.length)) return '*';
  const list = Array.isArray(fields) ? fields : String(fields).split(',').map((f) => f.trim());
  const cols = new Set(['id']);
  let extra = false;
  for (const f of list) {
    if (!f) continue;
    if (meta.columns[f] || f === 'id') cols.add(f);
    else extra = true;
  }
  if (extra) cols.add('_extra');
  return [...cols].join(',');
}

// --------------------------------------------------------------------------- update operators

function applyMongoUpdate(record, ops) {
  const next = {};
  const get = (k) => (k in next ? next[k] : record[k]);
  for (const [op, fields] of Object.entries(ops)) {
    for (const [k, v] of Object.entries(fields || {})) {
      switch (op) {
        case '$set': next[k] = v; break;
        case '$unset': next[k] = null; break;
        case '$currentDate': next[k] = new Date().toISOString(); break;
        case '$inc': next[k] = (Number(get(k)) || 0) + Number(v); break;
        case '$mul': next[k] = (Number(get(k)) || 0) * Number(v); break;
        case '$min': next[k] = get(k) === undefined || get(k) === null || v < get(k) ? v : get(k); break;
        case '$max': next[k] = get(k) === undefined || get(k) === null || v > get(k) ? v : get(k); break;
        case '$rename': next[v] = get(k); next[k] = null; break;
        case '$push': {
          const cur = Array.isArray(get(k)) ? [...get(k)] : [];
          if (isPlainObject(v) && Array.isArray(v.$each)) cur.push(...v.$each); else cur.push(v);
          next[k] = cur;
          break;
        }
        case '$addToSet': {
          const cur = Array.isArray(get(k)) ? [...get(k)] : [];
          const items = isPlainObject(v) && Array.isArray(v.$each) ? v.$each : [v];
          for (const it of items) if (!cur.some((c) => JSON.stringify(c) === JSON.stringify(it))) cur.push(it);
          next[k] = cur;
          break;
        }
        case '$pull': {
          const cur = Array.isArray(get(k)) ? get(k) : [];
          const drop = isPlainObject(v) && Array.isArray(v.$in) ? v.$in : [v];
          next[k] = cur.filter((c) => !drop.some((d) => JSON.stringify(c) === JSON.stringify(d)));
          break;
        }
        default:
          throw new Base44Error(`Update operator ${op} is not supported`, 400, 'UNSUPPORTED_OPERATOR', { error: op });
      }
    }
  }
  return next;
}

// --------------------------------------------------------------------------- aggregate

function bucketDate(value, unit) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const iso = d.toISOString();
  if (unit === 'year') return iso.slice(0, 4);
  if (unit === 'month') return iso.slice(0, 7);
  if (unit === 'week') {
    const day = (d.getUTCDay() + 6) % 7;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
    return monday.toISOString().slice(0, 10);
  }
  return iso.slice(0, 10);
}

function passesHaving(row, having) {
  if (!having) return true;
  return Object.entries(having).every(([k, cond]) => {
    const v = row[k];
    if (!isPlainObject(cond)) return v === cond;
    return Object.entries(cond).every(([op, x]) => {
      switch (op) {
        case '$eq': return v === x;
        case '$ne': return v !== x;
        case '$gt': return v > x;
        case '$gte': return v >= x;
        case '$lt': return v < x;
        case '$lte': return v <= x;
        case '$in': return x.includes(v);
        case '$nin': return !x.includes(v);
        default: return true;
      }
    });
  });
}

// --------------------------------------------------------------------------- entity handler

function createHandler(ctx, name, meta) {
  const { supabase, hooks } = ctx;
  const table = meta.table;
  const from = () => supabase.from(table);

  async function run(builder) {
    const { data, error, status, count } = await builder;
    if (error) throw fromPgError(error, status);
    return { data, count };
  }

  /** Raw rows, paged through Supabase's per-request row cap. */
  async function readRows(query, sort, limit, skip, fields) {
    const max = Number(limit) > 0 ? Number(limit) : DEFAULT_ARRAY_LIMIT;
    let offset = Number(skip) > 0 ? Number(skip) : 0;
    const cols = selectList(meta, fields);
    const out = [];
    while (out.length < max) {
      const n = Math.min(PAGE, max - out.length);
      let b = from().select(cols);
      b = applyQuery(b, meta, query);
      b = applySort(b, meta, sort);
      b = b.range(offset, offset + n - 1);
      const { data } = await run(b);
      out.push(...data);
      offset += data.length;
      if (data.length < n) break;
    }
    return out;
  }

  async function readArray(query, sort, limit, skip, fields) {
    const parts = bigInSplit(meta, query);
    if (parts) {
      const all = [];
      for (const q of parts) all.push(...(await readRows(q, sort, DEFAULT_ARRAY_LIMIT * 10, 0, fields)));
      const rows = all.map(normalizeRecord).sort(compareForSort(parseSort(sort)));
      const start = Number(skip) > 0 ? Number(skip) : 0;
      return rows.slice(start, start + (Number(limit) > 0 ? Number(limit) : DEFAULT_ARRAY_LIMIT));
    }
    return (await readRows(query, sort, limit, skip, fields)).map(normalizeRecord);
  }

  async function readDistinct(query, options) {
    const field = options.distinct;
    const limit = Math.min(Number(options.limit) || DEFAULT_PAGE_LIMIT, 1000);
    const state = options.cursor ? decodeCursor(options.cursor) : { o: 0 };
    const rows = await readArray(query, field, 50000, 0, [field]);
    const seen = new Map();
    for (const r of rows) {
      const v = r[field];
      for (const item of Array.isArray(v) ? v : [v]) {
        if (item === undefined || item === null) continue;
        const key = typeof item === 'object' ? JSON.stringify(item) : `${typeof item}:${item}`;
        if (!seen.has(key)) seen.set(key, item);
      }
    }
    const values = [...seen.values()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const items = values.slice(state.o, state.o + limit);
    const hasMore = state.o + limit < values.length;
    return { items, has_more: hasMore, next_cursor: hasMore ? encodeCursor({ o: state.o + limit }) : null };
  }

  async function readPage(query, options) {
    if ('distinct' in options) return readDistinct(query, options);
    const state = options.cursor ? decodeCursor(options.cursor) : { o: 0 };
    const sort = options.sort || state.s;
    const fields = options.fields || state.f;
    const limit = Math.min(Math.max(Number(options.limit) || DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);
    const rows = await readArray(query, sort, limit + 1, state.o, fields);
    const hasMore = rows.length > limit;
    return {
      items: rows.slice(0, limit),
      has_more: hasMore,
      next_cursor: hasMore ? encodeCursor({ o: state.o + limit, s: sort || null, f: fields || null }) : null,
    };
  }

  async function getRaw(id, cols = '*') {
    const { data } = await run(from().select(cols).eq('id', id).limit(1));
    if (!data || !data.length) throw notFound(name, id);
    return data[0];
  }

  async function count(query) {
    const parts = bigInSplit(meta, query);
    if (parts) {
      let total = 0;
      for (const q of parts) total += await count(q);
      return total;
    }
    let b = from().select('id', { count: 'exact', head: true });
    b = applyQuery(b, meta, query);
    const res = await run(b);
    return res.count || 0;
  }

  async function update(id, data) {
    if (id === undefined || id === null || id === '') throw new Base44Error('An id is required', 400, 'MISSING_ID', {});
    const { row, extra } = prepareWrite(meta, data);
    if (extra) {
      const current = await getRaw(id, '_extra');
      row._extra = { ...(current._extra || {}), ...extra };
    }
    if (!Object.keys(row).length) return normalizeRecord(await getRaw(id));
    const { data: rows } = await run(from().update(row).eq('id', id).select('*'));
    if (!rows || !rows.length) throw notFound(name, id);
    return normalizeRecord(rows[0]);
  }

  async function updateManyOnce(query, ops) {
    const keys = Object.keys(ops || {});
    if (!keys.length) return { success: true, updated: 0, has_more: false };
    const operatorForm = keys.every((k) => k.startsWith('$'));
    const plain = operatorForm ? ops : { $set: ops };
    const simple = Object.keys(plain).every((k) => ['$set', '$unset', '$currentDate'].includes(k));
    if (simple) {
      const patch = { ...(plain.$set || {}) };
      for (const k of Object.keys(plain.$unset || {})) patch[k] = null;
      for (const k of Object.keys(plain.$currentDate || {})) patch[k] = new Date().toISOString();
      const { row, extra } = prepareWrite(meta, patch);
      if (!extra) {
        if (!Object.keys(row).length) return { success: true, updated: await count(query), has_more: false };
        let b = from().update(row);
        b = applyQuery(b, meta, query, { requireFilter: true });
        const { data } = await run(b.select('id'));
        return { success: true, updated: data.length, has_more: false };
      }
    }
    // Operators Postgres can't do in one request ($inc, $push, ...): read, change, write back.
    const rows = await readArray(query, 'id', 100000, 0);
    await mapLimit(rows, 8, (r) => update(r.id, applyMongoUpdate(r, plain)));
    return { success: true, updated: rows.length, has_more: false };
  }

  async function deleteManyOnce(query) {
    let b = from().delete();
    b = applyQuery(b, meta, query, { requireFilter: true });
    const { data } = await run(b.select('id'));
    return { success: true, deleted: data.length };
  }

  const handler = {
    /** list(sort, limit, skip, fields) -> array;  list({ sort, limit, cursor, fields, distinct }) -> page */
    async list(sortOrOptions, limit, skip, fields) {
      if (isPlainObject(sortOrOptions)) return readPage(undefined, sortOrOptions);
      return readArray(undefined, sortOrOptions, limit, skip, fields);
    },

    /** filter(query, sort, limit, skip, fields) -> array;  filter(query, { ...options }) -> page */
    async filter(query, sortOrOptions, limit, skip, fields) {
      if (isPlainObject(sortOrOptions)) return readPage(query, sortOrOptions);
      return readArray(query, sortOrOptions, limit, skip, fields);
    },

    async get(id) {
      if (id === undefined || id === null || id === '') throw notFound(name, id);
      try {
        return normalizeRecord(await getRaw(id));
      } catch (e) {
        if (e?.status === 400 && e?.code === '22P02') throw notFound(name, id); // malformed id
        throw e;
      }
    },

    async create(data) {
      const { row, extra } = prepareWrite(meta, data);
      if (extra) row._extra = extra;
      const { data: rows } = await run(from().insert(row).select('*'));
      return normalizeRecord(rows[0]);
    },

    async bulkCreate(items) {
      const list = Array.isArray(items) ? items : [];
      const out = [];
      for (const part of chunk(list, WRITE_CHUNK)) {
        const rows = part.map((item) => {
          const { row, extra } = prepareWrite(meta, item);
          if (extra) row._extra = extra;
          return row;
        });
        const { data } = await run(from().insert(rows, { defaultToNull: false }).select('*'));
        out.push(...data.map(normalizeRecord));
      }
      return out;
    },

    update,

    async bulkUpdate(items) {
      const list = Array.isArray(items) ? items : [];
      return mapLimit(list, 8, ({ id, ...rest }) => update(id, rest));
    },

    async delete(id) {
      if (hooks?.deleteRow) {
        const handled = await hooks.deleteRow(name, id);
        if (handled) return handled;
      }
      const { data } = await run(from().delete().eq('id', id).select('id'));
      if (!data || !data.length) throw notFound(name, id);
      return { success: true };
    },

    async deleteMany(query) {
      const parts = bigInSplit(meta, query);
      if (!parts) return deleteManyOnce(query);
      let deleted = 0;
      for (const q of parts) deleted += (await deleteManyOnce(q)).deleted;
      return { success: true, deleted };
    },

    async updateMany(query, ops) {
      const parts = bigInSplit(meta, query);
      if (!parts) return updateManyOnce(query, ops);
      let updated = 0;
      for (const q of parts) updated += (await updateManyOnce(q, ops)).updated;
      return { success: true, updated, has_more: false };
    },

    count,

    async aggregate(spec = {}) {
      const groupBy = spec.groupBy ? [].concat(spec.groupBy) : [];
      const list = (v) => (v ? [].concat(v) : []);
      const sums = list(spec.sum);
      const avgs = list(spec.avg);
      const mins = list(spec.min);
      const maxs = list(spec.max);
      const bucket = spec.dateBucket;
      const fields = [...new Set([...groupBy, ...sums, ...avgs, ...mins, ...maxs, ...list(spec.countDistinct), ...(bucket ? [bucket.field] : [])])];
      const rows = await readArray(spec.query || {}, 'id', 200000, 0, fields.length ? fields : ['id']);
      const groups = new Map();
      for (const r of rows) {
        const keyVals = groupBy.map((g) => (r[g] === undefined ? null : r[g]));
        if (bucket) keyVals.push(bucketDate(r[bucket.field], bucket.unit));
        const key = JSON.stringify(keyVals);
        if (!groups.has(key)) groups.set(key, { keyVals, rows: [] });
        groups.get(key).rows.push(r);
      }
      let out = [];
      for (const { keyVals, rows: rs } of groups.values()) {
        const row = {};
        groupBy.forEach((g, i) => { row[g] = keyVals[i]; });
        if (bucket) row[bucket.field] = keyVals[keyVals.length - 1];
        if (spec.count !== false) row.count = rs.length;
        const nums = (f) => rs.map((r) => Number(r[f])).filter((n) => Number.isFinite(n));
        for (const f of sums) row[`sum_${f}`] = nums(f).reduce((a, b) => a + b, 0);
        for (const f of avgs) { const n = nums(f); row[`avg_${f}`] = n.length ? n.reduce((a, b) => a + b, 0) / n.length : null; }
        for (const f of mins) { const v = rs.map((r) => r[f]).filter((x) => x !== undefined && x !== null); row[`min_${f}`] = v.length ? v.reduce((a, b) => (b < a ? b : a)) : null; }
        for (const f of maxs) { const v = rs.map((r) => r[f]).filter((x) => x !== undefined && x !== null); row[`max_${f}`] = v.length ? v.reduce((a, b) => (b > a ? b : a)) : null; }
        if (spec.countDistinct) row[`count_distinct_${spec.countDistinct}`] = new Set(rs.map((r) => JSON.stringify(r[spec.countDistinct] ?? null))).size;
        out.push(row);
      }
      out = out.filter((r) => passesHaving(r, spec.having));
      if (spec.sort) out.sort(compareForSort(parseSort(spec.sort)));
      const limit = Math.min(Number(spec.limit) || 1000, 1000);
      return { rows: out.slice(0, limit), truncated: out.length > limit };
    },

    async upsert(records, options = {}) {
      const keys = [].concat(options.key || []);
      if (!keys.length) throw new Base44Error('upsert needs a key', 400, 'MISSING_KEY', {});
      let created = 0;
      let updated = 0;
      const out = [];
      for (const rec of [].concat(records || [])) {
        const q = Object.fromEntries(keys.map((k) => [k, rec[k] ?? null]));
        const [existing] = await readArray(q, 'created_date', 1, 0, ['id']);
        if (existing) { out.push(await update(existing.id, rec)); updated++; }
        else { out.push(await handler.create(rec)); created++; }
      }
      return { created, updated, records: out };
    },

    async importEntities() {
      throw new Base44Error('importEntities is not available after the move to Supabase', 501, 'NOT_SUPPORTED', {});
    },

    /** Live changes for this table. Returns an unsubscribe function. */
    subscribe(callback) {
      if (typeof supabase.channel !== 'function') return () => {};
      const channel = supabase
        .channel(`b44:${table}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const type = { INSERT: 'create', UPDATE: 'update', DELETE: 'delete' }[payload.eventType];
          const rec = type === 'delete' ? payload.old : payload.new;
          try {
            callback({ type, data: normalizeRecord(rec), id: rec?.id, timestamp: payload.commit_timestamp || new Date().toISOString() });
          } catch (e) {
            console.error('[entities] subscription callback error', e);
          }
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
  return handler;
}

/**
 * entities.<EntityName> -> handler. Unknown names throw a clear error instead of failing later.
 * hooks.deleteRow(name, id): optional override for deletes (used for User -> delete the auth user).
 */
export function createEntities({ supabase, schema, hooks = {} }) {
  const cache = new Map();
  return new Proxy(
    {},
    {
      get(_target, name) {
        if (typeof name !== 'string' || name === 'then' || name.startsWith('_')) return undefined;
        if (!cache.has(name)) {
          const meta = schema[name];
          if (!meta) throw new Error(`Unknown entity "${name}". Add schema/entities/${name}.jsonc and run npm run db:generate.`);
          cache.set(name, createHandler({ supabase, hooks }, name, meta));
        }
        return cache.get(name);
      },
      has(_target, name) {
        return typeof name === 'string' && name in schema;
      },
      ownKeys() {
        return Object.keys(schema);
      },
      getOwnPropertyDescriptor(_target, name) {
        return name in schema ? { enumerable: true, configurable: true } : undefined;
      },
    },
  );
}
