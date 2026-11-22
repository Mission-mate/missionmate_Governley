/**
 * Count-up entrance for summary-card numbers (every element with the shared
 * `glow-value` class from lib/glowCard).
 *
 * Each value animates once, when its element first mounts, from zero to the
 * text it rendered — so "$12,450", "85%" or "3 / 10" keep their exact formatting.
 * While the page entrance is still pending (see lib/entranceMotion) the number
 * waits at zero, then counts up alongside the page fade. Ordinary re-renders
 * reuse the same element and never replay it; if React writes a new value
 * mid-animation, the animation stops and React's value stands.
 */
const SELECTOR = '.glow-value';
const NUMBER = /\d[\d,]*(?:\.\d+)?/g;
const DURATION = 1400;
const MAX_HOLD_MS = 8000;

const seen = new WeakSet();
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Builds a renderer that writes `text` with every number scaled by `p` (0–1). */
function template(text) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(NUMBER)) {
    parts.push(text.slice(last, m.index));
    const raw = m[0];
    const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
    parts.push({ value: Number(raw.replace(/,/g, '')), decimals, grouped: raw.includes(',') });
    last = m.index + raw.length;
  }
  if (parts.length === 0) return null;
  parts.push(text.slice(last));
  return (p) => parts.map((part) => {
    if (typeof part === 'string') return part;
    const n = part.value * p;
    return part.grouped
      ? n.toLocaleString('en-US', { minimumFractionDigits: part.decimals, maximumFractionDigits: part.decimals })
      : n.toFixed(part.decimals);
  }).join('');
}

function animate(el) {
  if (seen.has(el)) return;
  seen.add(el);
  if (reducedMotion()) return;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const render = template(node.nodeValue);
    if (render) nodes.push({ node, final: node.nodeValue, render, written: null });
  }
  if (nodes.length === 0) return;

  const write = (p) => nodes.forEach((n) => {
    if (n.done) return;
    // React replaced the value — keep its text and stop animating this node.
    if (n.written !== null && n.node.nodeValue !== n.written) { n.done = true; return; }
    n.written = p >= 1 ? n.final : n.render(p);
    n.node.nodeValue = n.written;
  });

  write(0);
  const heldSince = performance.now();
  let start = null;
  const frame = (now) => {
    if (!el.isConnected) return;
    if (start === null) {
      if (el.closest('[data-entrance-pending]') && now - heldSince < MAX_HOLD_MS) {
        requestAnimationFrame(frame);
        return;
      }
      start = now;
    }
    const t = Math.min(1, (now - start) / DURATION);
    write(t >= 1 ? 1 : easeOut(t));
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function scan(node) {
  if (node.nodeType !== 1) return;
  if (node.matches(SELECTOR)) animate(node);
  node.querySelectorAll(SELECTOR).forEach(animate);
}

/** Animates summary numbers already in `root` and any that mount later. Returns a stop function. */
export function watchCountUps(root) {
  scan(root);
  const obs = new MutationObserver((records) => {
    records.forEach((r) => r.addedNodes.forEach(scan));
  });
  obs.observe(root, { childList: true, subtree: true });
  return () => obs.disconnect();
}