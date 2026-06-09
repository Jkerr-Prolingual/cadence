import { useState, useRef, useEffect } from 'react';

const TOOL_SETS = [
  { id: 'listen', label: 'Listen & Read', icon: 'headphones' },
  { id: 'shadow', label: 'Shadow Read', icon: 'loop' },
  { id: 'record', label: 'Record & Review', icon: 'mic' },
  { id: 'timed', label: 'Timed Read', icon: 'timer' },
];

const ICONS = {
  headphones: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12V8a5 5 0 0 1 10 0v4" />
      <rect x="1" y="10" width="3" height="4" rx="1" />
      <rect x="12" y="10" width="3" height="4" rx="1" />
    </svg>
  ),
  loop: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4" />
      <path d="M12.5 1v3h-3" />
      <path d="M3.5 15v-3h3" />
    </svg>
  ),
  mic: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="6" r="4" />
      <path d="M3 6a5 5 0 0 0 10 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" />
      <line x1="5" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  timer: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="9" r="6" />
      <line x1="8" y1="9" x2="8" y2="6" />
      <line x1="8" y1="1" x2="8" y2="3" />
      <line x1="6" y1="1" x2="10" y2="1" />
    </svg>
  ),
};

export default function ToolSetSelector({ active, onSelect, hasAudio }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const available = hasAudio
    ? TOOL_SETS
    : TOOL_SETS.filter(t => t.id === 'timed');

  const current = TOOL_SETS.find(t => t.id === active) || TOOL_SETS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-colors"
      >
        {ICONS[current.icon]}
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">{current.label.split(' ')[0]}</span>
        <svg className="w-3 h-3 ml-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
          {available.map(tool => (
            <button
              key={tool.id}
              onClick={() => { onSelect(tool.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 sm:py-2 text-sm text-left transition-colors ${
                active === tool.id
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              {ICONS[tool.icon]}
              {tool.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
