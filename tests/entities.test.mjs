// Unit tests for the data adapter's query translation. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryToLogicTree, normalizeRecord } from '../supabase/functions/_shared/b44/entities.js';
import { SCHEMA } from '../supabase/functions/_shared/b44/schema.generated.js';

const conv = SCHEMA.Conversation;
const risk = SCHEMA.Risk;
const tree = (meta, q) => queryToLogicTree(meta, q);

test('every entity has a table and an id column', () => {
  for (const [name, meta] of Object.entries(SCHEMA)) {
    assert.ok(meta.table, name);
    assert.equal(meta.columns.id, 'text', name);
  }
});

test('empty query matches everything', () => {
  assert.equal(tree(risk, {}), null);
  assert.equal(tree(risk, undefined), null);
});

test('equality, null and $ne (missing fields count as "not equal", like MongoDB)', () => {
  assert.equal(tree(risk, { status: 'Open' }), 'and(status.eq."Open")');
  assert.equal(tree(risk, { status: null }), 'and(status.is.null)');
  assert.equal(tree(risk, { status: { $ne: 'Closed' } }), 'and(or(status.is.null,status.neq."Closed"))');
});

test('$in / $nin and the array shorthand', () => {
  assert.equal(tree(risk, { id: { $in: ['a', 'b'] } }), 'and(id.in.("a","b"))');
  assert.equal(tree(risk, { status: ['A', 'B'] }), 'and(status.in.("A","B"))');
  assert.equal(tree(risk, { status: { $in: [] } }), 'and(id.is.null)');
  assert.equal(tree(risk, { status: { $nin: ['A'] } }), 'and(or(status.is.null,status.not.in.("A")))');
});

test('array (jsonb) fields use "contains"', () => {
  assert.equal(tree(conv, { member_ids: 'u1' }), 'and(member_ids.cs."[\\"u1\\"]")');
  assert.equal(
    tree(conv, { member_ids: 'u1', hidden_by: { $nin: ['u1'] } }),
    'and(member_ids.cs."[\\"u1\\"]",or(hidden_by.is.null,hidden_by.not.cs."[\\"u1\\"]"))',
  );
});

test('values with reserved characters are quoted and escaped', () => {
  assert.equal(tree(risk, { title: 'a,b (c) "d" \\e' }), 'and(title.eq."a,b (c) \\"d\\" \\\\e")');
});

test('$regex with $options i becomes imatch', () => {
  assert.equal(tree(risk, { title: { $regex: 'abc', $options: 'i' } }), 'and(title.imatch."abc")');
});

test('$or / $nor (negation guards empty fields)', () => {
  assert.equal(
    tree(risk, { id: 'x', $or: [{ version: 0 }, { version: { $exists: false } }] }),
    'and(id.eq."x",or(version.eq.0,version.is.null))',
  );
  assert.equal(tree(risk, { $nor: [{ status: 'Open' }] }), 'and(not.or(and(status.not.is.null,status.eq."Open")))');
});

test('fields that are not in the schema are read from _extra', () => {
  assert.equal(tree(risk, { not_a_column: 'x' }), 'and(_extra->>not_a_column.eq."x")');
});

test('unsupported operators fail loudly', () => {
  assert.throws(() => tree(risk, { title: { $size: 2 } }), /not supported/);
});

test('normalizeRecord drops empty fields and merges _extra', () => {
  assert.deepEqual(normalizeRecord({ id: '1', a: null, b: 2, _extra: { c: 3, d: null } }), { id: '1', b: 2, c: 3 });
});
