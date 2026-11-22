import { base44 } from '@/api/base44Client';
import { localToday } from '@/lib/localClock';

const UNTITLED_PAGE = 'Untitled';

/** Strip HTML to a short plain-text excerpt for page nav previews. */
export function excerptFrom(html, max = 140) {
  const text = String(html || '')
    .replace(/<(br|\/p|\/li|\/h[1-6]|hr)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function cleanTitle(title) {
  const t = String(title ?? '').trim();
  return t || UNTITLED_PAGE;
}

export function listNotePages(objectType, objectId, entityName = 'NotePage') {
  return base44.entities[entityName].filter(
    { object_type: objectType, object_id: objectId },
    'order_index'
  );
}

// `entityName` lets a module (e.g. Planner) keep its note pages in its own entity.
export function createNotePage(objectType, objectId, {
  title, content = '', order_index = 0, owner_name = '', page_date = localToday(), color,
} = {}, entityName = 'NotePage') {
  if (!objectType || !objectId) throw new Error('A note page needs an owning record.');
  return base44.entities[entityName].create({
    object_type: objectType,
    object_id: objectId,
    title: cleanTitle(title),
    content,
    excerpt: excerptFrom(content),
    order_index,
    owner_name,
    page_date,
    ...(color ? { color } : {}),
  });
}

export function updateNotePage(id, { title, content, owner_name, page_date, color } = {}, entityName = 'NotePage') {
  if (!id) throw new Error('A note page id is required.');
  const payload = {};
  if (title !== undefined) payload.title = cleanTitle(title);
  if (owner_name !== undefined) payload.owner_name = String(owner_name).trim();
  if (page_date !== undefined) payload.page_date = page_date || '';
  if (color) payload.color = color;
  if (content !== undefined) {
    payload.content = content || '';
    payload.excerpt = excerptFrom(content);
  }
  return base44.entities[entityName].update(id, payload);
}

export function deleteNotePage(id, entityName = 'NotePage') {
  if (!id) throw new Error('A note page id is required.');
  return base44.entities[entityName].delete(id);
}