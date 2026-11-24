import { useLayoutEffect, useRef } from 'react';

const inlineFormats = [
  { label: 'Negrita', mark: '*', glyph: <strong>B</strong> },
  { label: 'Cursiva', mark: '_', glyph: <em>I</em> },
  { label: 'Tachado', mark: '~', glyph: <s>S</s> },
  { label: 'Monoespaciado', mark: '```', glyph: <span className="font-mono">{'</>'}</span> },
];

const lineFormats = [
  { label: 'Lista con viñetas', prefix: () => '- ', glyph: 'format_list_bulleted' },
  { label: 'Lista numerada', prefix: (index) => `${index + 1}. `, glyph: 'format_list_numbered' },
  { label: 'Cita', prefix: () => '> ', glyph: 'format_quote' },
];

const buttonClass = 'grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-sm text-text-main hover:bg-slate-200 dark:hover:bg-slate-700';

export default function WhatsAppMessageEditor({ label, value, rows, onChange }) {
  const textareaRef = useRef(null);
  const nextSelection = useRef(null);

  useLayoutEffect(() => {
    if (!nextSelection.current) return;
    const [start, end] = nextSelection.current;
    nextSelection.current = null;
    textareaRef.current.focus({ preventScroll: true });
    textareaRef.current.setSelectionRange(start, end);
  }, [value]);

  const replace = (start, end, text, selectionStart, selectionEnd) => {
    const nextValue = value.slice(0, start) + text + value.slice(end);
    if (nextValue === value) {
      textareaRef.current.focus({ preventScroll: true });
      textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
      return;
    }
    nextSelection.current = [selectionStart, selectionEnd];
    onChange(nextValue);
  };

  const wrapSelection = (mark) => {
    const { selectionStart: start, selectionEnd: end } = textareaRef.current;
    const selected = value.slice(start, end);
    if (selected && value.slice(start - mark.length, start) === mark && value.slice(end, end + mark.length) === mark) {
      replace(start - mark.length, end + mark.length, selected, start - mark.length, end - mark.length);
      return;
    }
    replace(start, end, mark + selected + mark, start + mark.length, end + mark.length);
  };

  const formatLines = (prefix) => {
    const editor = textareaRef.current;
    const start = editor.selectionStart;
    let end = editor.selectionEnd;
    if (end > start && value[end - 1] === '\n') end -= 1;
    const lineStart = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1;
    const newline = value.indexOf('\n', end);
    const lineEnd = newline === -1 ? value.length : newline;
    const text = value.slice(lineStart, lineEnd).split('\n')
      .map((line, index) => prefix(index) + line.replace(/^(?:- |\d+\. |> )/, ''))
      .join('\n');
    const position = start === end ? Math.min(lineStart + text.length, start + text.length - (lineEnd - lineStart)) : lineStart;
    replace(lineStart, lineEnd, text, position, start === end ? position : lineStart + text.length);
  };

  return (
    <div>
      <span className="text-[11px] font-semibold text-text-sub">{label}</span>
      <div className="mt-1 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-400">
        <div role="group" aria-label="Formato de WhatsApp" className="flex flex-wrap gap-0.5 border-b border-slate-200 bg-slate-50 px-1.5 py-1 dark:border-slate-700 dark:bg-slate-800">
          {inlineFormats.map(({ label: name, mark, glyph }) => (
            <button key={name} type="button" className={buttonClass} title={name} aria-label={name}
              onMouseDown={(event) => event.preventDefault()} onClick={() => wrapSelection(mark)}>{glyph}</button>
          ))}
          {lineFormats.map(({ label: name, prefix, glyph }) => (
            <button key={name} type="button" className={buttonClass} title={name} aria-label={name}
              onMouseDown={(event) => event.preventDefault()} onClick={() => formatLines(prefix)}>
              <span aria-hidden="true" className="material-symbols-outlined text-[17px]">{glyph}</span>
            </button>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          aria-label={label}
          data-dialog-initial-focus
          rows={rows || 10}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="whatsapp-message-editor block w-full resize-y bg-transparent px-3 py-2 text-sm text-text-main"
        />
      </div>
    </div>
  );
}
