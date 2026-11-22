import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2 } from 'lucide-react';

/**
 * Lightweight contentEditable rich-text field supporting bold/italic/underline,
 * bullet/numbered lists and links. Stores and emits HTML. The content area has
 * a minimum height only, so it grows with its content.
 */
export default function RichTextField({ value, onChange, placeholder, minHeight = 120, enableLinks = false, sanitize }) {
  const editorRef = useRef(null);
  // Optional sanitizer: when given, nothing unsanitized is loaded into, pasted
  // into, or emitted from the editor.
  const clean = (html) => (sanitize ? sanitize(html) : html);

  // Sync external value into the editor only when it differs from the live DOM
  // (avoids caret jumps while typing).
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = clean(value || '');
    if (clean(el.innerHTML) !== next) el.innerHTML = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInput = () => onChange(clean(editorRef.current?.innerHTML || ''));

  const execCmd = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
    handleInput();
  };

  const handlePaste = (e) => {
    if (!sanitize) return;
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    if (html) document.execCommand('insertHTML', false, sanitize(html));
    else document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  };

  const insertLink = () => {
    const url = window.prompt('Enter the link URL');
    if (!url) return;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    document.execCommand('createLink', false, href);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-white">
        {[
          { icon: Bold, cmd: 'bold', title: 'Bold' },
          { icon: Italic, cmd: 'italic', title: 'Italic' },
          { icon: Underline, cmd: 'underline', title: 'Underline' },
        ].map(({ icon: Icon, cmd, title }) => (
          <button
            key={cmd}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
            title={title}
            className="p-1.5 rounded hover:bg-muted transition-colors text-foreground"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }}
          title="Bullet List"
          className="p-1.5 rounded hover:bg-muted transition-colors text-foreground"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }}
          title="Numbered List"
          className="p-1.5 rounded hover:bg-muted transition-colors text-foreground"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        {enableLinks && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
              title="Insert Link"
              className="p-1.5 rounded hover:bg-muted transition-colors text-foreground"
            >
              <Link2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onPaste={handlePaste}
        style={{ minHeight }}
        className="font-body bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_a]:text-primary [&_a]:underline"
      />
    </div>
  );
}