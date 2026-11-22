import React, { useEffect, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Link2 } from 'lucide-react';
import ToolbarButton from './ToolbarButton';
import ToolbarBlockMenu from './ToolbarBlockMenu';
import ToolbarLinkField from './ToolbarLinkField';
import { blockIdOf, linkRangeAt, normalizeUrl } from './toolbarUtils';

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';
const INLINE = [
  { format: 'bold', icon: Bold, label: 'Bold', keys: `${MOD}B` },
  { format: 'italic', icon: Italic, label: 'Italic', keys: `${MOD}I` },
  { format: 'underline', icon: Underline, label: 'Underline', keys: `${MOD}U` },
  { format: 'strike', icon: Strikethrough, label: 'Strikethrough' },
];
const SEPARATOR = <span className="w-px h-4 bg-border mx-1 shrink-0" />;

/** Permanent inline format toolbar above the note body: block type, inline formats and link. */
export default function NoteToolbar({ quillRef }) {
  const [formats, setFormats] = useState({});
  const [canLink, setCanLink] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [link, setLink] = useState(null); // { range, url, hasLink } while the URL field is open
  const getQuill = () => quillRef.current?.getEditor();

  const sync = () => {
    const quill = getQuill();
    const sel = quill?.getSelection();
    const next = sel ? quill.getFormat(sel) : {};
    setFormats(next);
    setCanLink(!!sel && (sel.length > 0 || !!next.link));
  };

  useEffect(() => {
    const quill = getQuill();
    if (!quill) return undefined;
    const onChange = () => { setMenuOpen(false); sync(); };
    quill.on('editor-change', onChange);
    return () => quill.off('editor-change', onChange);
  }, []);

  // Formats apply to the current selection, or to what is typed next at the caret.
  const run = (apply) => {
    const quill = getQuill();
    apply(quill, quill.getSelection(true));
    sync();
  };

  const openLink = () => {
    const quill = getQuill();
    const sel = quill.getSelection();
    if (!sel) return;
    const current = quill.getFormat(sel).link;
    const range = sel.length ? sel : linkRangeAt(quill, sel.index);
    if (range) setLink({ range, url: typeof current === 'string' ? current : '', hasLink: !!current });
  };
  const closeLink = (raw) => {
    const quill = getQuill();
    const { range } = link;
    setLink(null);
    if (raw !== undefined) quill.formatText(range.index, range.length, 'link', normalizeUrl(raw) || false, 'user');
    quill.setSelection(range.index, range.length, 'user');
  };

  return (
    <div
      onMouseDown={(e) => { if (e.target.tagName !== 'INPUT') e.preventDefault(); }}
      className="shrink-0 flex items-center gap-3 py-1.5 border-y border-border"
    >
      {link ? (
        <ToolbarLinkField
          value={link.url}
          hasLink={link.hasLink}
          onChange={(url) => setLink((l) => ({ ...l, url }))}
          onApply={closeLink}
          onCancel={() => closeLink()}
          onBlur={() => setLink(null)}
        />
      ) : (
        <div className="flex-1 min-w-0 flex items-center gap-0.5">
          <ToolbarBlockMenu
            currentId={blockIdOf(formats)}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onSelect={(b) => { setMenuOpen(false); run((quill, r) => quill.formatLine(r.index, r.length, b.format, 'user')); }}
          />
          {SEPARATOR}
          {INLINE.map((b) => (
            <ToolbarButton
              key={b.format}
              icon={b.icon}
              label={b.label}
              keys={b.keys}
              active={!!formats[b.format]}
              onClick={() => run((quill, r) => quill.format(b.format, !quill.getFormat(r)[b.format], 'user'))}
            />
          ))}
          {SEPARATOR}
          <ToolbarButton icon={Link2} label="Link" active={!!formats.link} disabled={!canLink} onClick={openLink} />
        </div>
      )}
      <p className="hidden sm:block shrink-0 whitespace-nowrap text-xs text-muted-foreground select-none">
        Type
        <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 mx-1 rounded-md border border-border bg-muted/50 font-mono text-xs align-middle">/</kbd>
        for blocks
      </p>
    </div>
  );
}