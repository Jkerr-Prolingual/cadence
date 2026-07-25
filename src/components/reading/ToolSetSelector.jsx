import { getUILabel } from '../../lib/locales';

const TOOL_SETS = [
  { id: 'listen', labelKey: 'listenRead', icon: 'headphones' },
  { id: 'translate', labelKey: 'translate', icon: 'translate' },
  { id: 'shadow', labelKey: 'shadowRead', icon: 'loop' },
  { id: 'timed', labelKey: 'timedRead', icon: 'timer' },
  { id: 'record', labelKey: 'pronunciation', icon: 'mic' },
];

const ICONS = {
  headphones: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12V8a5 5 0 0 1 10 0v4" />
      <rect x="1" y="10" width="3" height="4" rx="1" />
      <rect x="12" y="10" width="3" height="4" rx="1" />
    </svg>
  ),
  translate: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3h7M5.5 1v2M3.5 3c0 2 1 4 4 5.5" />
      <path d="M7.5 3c0 1.5-.5 3-2 4.5" />
      <path d="M9 9l2.5 6M14 9l-2.5 6M9.75 13h3.5" />
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

export default function ToolSetSelector({ active, onSelect, hasAudio, hasSyntaxGlosses, translationMode, l1 }) {
  const available = TOOL_SETS.filter(t => {
    if (t.id === 'translate') return hasSyntaxGlosses;
    if (!hasAudio) return t.id === 'timed';
    return true;
  });

  if (available.length <= 1) return null;

  return (
    <div className="inline-flex flex-wrap rounded-lg border border-gray-200 bg-gray-100/80 p-0.5 gap-0.5">
      {available.map(tool => {
        const isActive = tool.id === 'translate' ? translationMode : active === tool.id;
        const label = getUILabel(tool.labelKey, l1);
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            title={label}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              isActive
                ? tool.id === 'translate'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {ICONS[tool.icon]}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
