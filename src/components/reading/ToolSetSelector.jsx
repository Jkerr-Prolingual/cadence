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
  const available = hasAudio
    ? TOOL_SETS
    : TOOL_SETS.filter(t => t.id === 'timed');

  if (available.length <= 1) return null;

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100/80 p-0.5 gap-0.5">
      {available.map(tool => {
        const isActive = active === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            title={tool.label}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {ICONS[tool.icon]}
            <span>{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}
