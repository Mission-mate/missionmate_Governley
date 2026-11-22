import DOMPurify from 'dompurify';

// The only markup Risk rich text may carry: basic formatting, lists and the
// line containers a contentEditable produces. No attributes at all, so links,
// styles, event handlers, embeds and SVG can never survive.
const CONFIG = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'p', 'div', 'br'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
};

/** Sanitize Risk rich-text HTML. Applied both when editing and before rendering. */
export function sanitizeRiskHtml(html) {
  return html ? DOMPurify.sanitize(String(html), CONFIG) : '';
}