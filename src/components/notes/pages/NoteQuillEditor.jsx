import React, { useRef, useState, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import { registerNoteFormats, SLASH_BLOCKS } from './noteBlocks';
import NoteToolbar from './toolbar/NoteToolbar';
import SlashPlaceholder from './SlashPlaceholder';

const isBlank = (q) => q.getLength() <= 1 && !Object.keys(q.getFormat(0, 1)).length;

registerNoteFormats();

const MODULES = { toolbar: false, history: { delay: 600, maxStack: 200, userOnly: true } };
const FORMATS = ['header', 'list', 'bold', 'italic', 'underline', 'strike', 'link', 'divider'];

/**
 * Document-style rich-text editor: Quill core with a permanent inline toolbar
 * for formatting and a "/" slash-command block menu. Undo/redo via ⌘Z / ⌘⇧Z.
 */
export default function NoteQuillEditor({ value, onChange, onBlur, readOnly = false }) {
  const quillRef = useRef(null);
  const [menu, setMenu] = useState(null);
  const [hint, setHint] = useState(null);

  const editor = () => quillRef.current?.getEditor();
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  // Slash hint: shown at the caret whenever it sits on an empty paragraph line,
  // and at the top of a completely blank document while unfocused.
  useEffect(() => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    const update = () => {
      if (readOnlyRef.current) return setHint(null);
      const sel = q.getSelection();
      if (!sel) return setHint(isBlank(q) ? { top: 0, left: 0 } : null);
      if (sel.length) return setHint(null);
      const node = q.getLine(sel.index)[0]?.domNode;
      if (!node || node.tagName !== 'P' || node.textContent) return setHint(null);
      const b = q.getBounds(sel.index);
      setHint({ top: b.top + q.container.offsetTop, left: b.left });
    };
    update();
    q.on('editor-change', update);
    return () => q.off('editor-change', update);
  }, []);

  // Checklist toggling. Quill persists checked state as <ul data-checked>, but its
  // native handler toggles on any click on the line's text and bypasses history.
  // One capture-phase listener takes over: only the checkbox gutter toggles, via
  // formatLine with source 'user' so each toggle is a single undoable step.
  useEffect(() => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    const root = q.root;
    const checklistItem = (target) =>
      target?.tagName === 'LI' && target.parentNode?.hasAttribute?.('data-checked') ? target : null;

    const onMouseDown = (e) => {
      const li = checklistItem(e.target);
      if (!li) return;
      e.stopPropagation(); // block Quill's native text-click toggle
      const gutter = parseFloat(window.getComputedStyle(li).paddingLeft) || 0;
      if (e.clientX - li.getBoundingClientRect().left > gutter) return; // text click: normal caret
      e.preventDefault();
      if (readOnlyRef.current) return;
      const blot = Quill.find(li);
      if (!blot) return;
      const next = li.parentNode.getAttribute('data-checked') === 'true' ? 'unchecked' : 'checked';
      q.formatLine(q.getIndex(blot), 1, 'list', next, 'user');
    };
    // Touch taps: block the native handler; the emulated mousedown does the toggle.
    const onTouchStart = (e) => { if (checklistItem(e.target)) e.stopPropagation(); };

    root.addEventListener('mousedown', onMouseDown, true);
    root.addEventListener('touchstart', onTouchStart, true);
    return () => {
      root.removeEventListener('mousedown', onMouseDown, true);
      root.removeEventListener('touchstart', onTouchStart, true);
    };
  }, []);

  const handleChange = (html, delta, source) => {
    onChange(html);
    const q = editor();
    if (source !== 'user') return;
    const sel = q?.getSelection();
    if (!q || !sel) { setMenu(null); return; }
    const [line, offset] = q.getLine(sel.index);
    const text = line?.domNode?.textContent || '';
    // "/" as the only character on the line opens the block menu.
    if (text === '/' && offset === 1) {
      const bounds = q.getBounds(sel.index);
      setMenu({ top: bounds.bottom + 6, left: bounds.left, index: sel.index });
    } else {
      setMenu(null);
    }
  };

  const applyBlock = (block) => {
    const q = editor();
    if (!q || !menu) return;
    const slashAt = menu.index - 1;
    q.deleteText(slashAt, 1, 'user');
    if (block.divider) {
      q.insertEmbed(slashAt, 'divider', true, 'user');
      q.setSelection(slashAt + 1, 0, 'user');
    } else {
      q.formatLine(slashAt, 1, block.format, 'user');
      q.setSelection(slashAt, 0, 'user');
    }
    setMenu(null);
    onChange(q.root.innerHTML);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {!readOnly && <NoteToolbar quillRef={quillRef} />}
      <div className={cn('relative flex-1 min-h-0 overflow-y-auto pb-5', readOnly ? 'pt-1' : 'pt-3')}>
      <div
        onKeyDown={(e) => { if (e.key === 'Escape') setMenu(null); }}
        className={cn(
          'note-editor relative font-body text-sm text-foreground',
          '[&_.ql-container]:border-0 [&_.ql-container]:font-body [&_.ql-container]:text-sm',
          '[&_.ql-editor]:px-0 [&_.ql-editor]:py-0 [&_.ql-editor]:min-h-[320px] [&_.ql-editor]:leading-relaxed',
          '[&_.ql-editor_h1]:text-2xl [&_.ql-editor_h1]:font-semibold [&_.ql-editor_h1]:mt-5 [&_.ql-editor_h1]:mb-2',
          '[&_.ql-editor_h2]:text-lg [&_.ql-editor_h2]:font-semibold [&_.ql-editor_h2]:mt-4 [&_.ql-editor_h2]:mb-1.5',
          '[&_.ql-editor_a]:text-primary [&_.ql-editor_a]:underline [&_.ql-editor_a]:underline-offset-2',
          '[&_.ql-editor_hr]:my-5 [&_.ql-editor_hr]:border-0 [&_.ql-editor_hr]:border-t [&_.ql-editor_hr]:border-border',
          '[&_.ql-editor.ql-blank::before]:hidden'
        )}
      >
        {!readOnly && hint && <SlashPlaceholder style={hint} />}
        <ReactQuill
          ref={quillRef}
          theme="snow"
          readOnly={readOnly}
          defaultValue={value || ''}
          onChange={handleChange}
          onBlur={() => { setMenu(null); onBlur?.(); }}
          modules={MODULES}
          formats={FORMATS}
        />
      </div>

      {menu && (
        <div
          className="animate-dropdown-enter absolute z-30 w-64 rounded-xl border border-border bg-popover shadow-lg py-1.5"
          style={{ top: menu.top, left: menu.left }}
        >
          <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Blocks</p>
          {SLASH_BLOCKS.map((block) => (
            <button
              key={block.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyBlock(block); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-muted transition-colors"
            >
              <span className="w-7 h-7 rounded-md border border-border flex items-center justify-center shrink-0">
                <block.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground truncate">{block.label}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{block.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}