import { useState, useRef, useEffect } from 'react';
import { cefrColor } from '../../lib/wordUtils';

export default function TextSelector({ texts, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const idx = texts.findIndex(t => t.id === selectedId);
  const current = texts[idx];
  const prev = idx > 0 ? texts[idx - 1] : null;
  const next = idx < texts.length - 1 ? texts[idx + 1] : null;

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!current) return null;

  function select(id) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative border-b border-gray-100 px-3 sm:px-4 py-2 flex items-center gap-2">
      <button
        onClick={() => prev && select(prev.id)}
        disabled={!prev}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
        aria-label="Previous chapter"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 12L6 8l4-4" />
        </svg>
      </button>

      <button
        onClick={() => setOpen(o => !o)}
        className="flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-gray-200 hover:border-gray-400 transition-colors"
      >
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: cefrColor(current.cefr) }}
        />
        <span className="truncate">
          Ch {idx + 1}: {current.title}
        </span>
        <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={open ? "M12 10L8 6l-4 4" : "M4 6l4 4 4-4"} />
        </svg>
      </button>

      <button
        onClick={() => next && select(next.id)}
        disabled={!next}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default"
        aria-label="Next chapter"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4l4 4-4 4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
          {texts.map((t, i) => {
            const active = t.id === selectedId;
            return (
              <button
                key={t.id}
                onClick={() => select(t.id)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cefrColor(t.cefr) }}
                />
                <span className="truncate">Ch {i + 1}: {t.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
