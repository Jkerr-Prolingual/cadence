import { getUILabel } from '../../lib/locales';

const TOOL_SETS = [
  { id: 'listen', labelKey: 'listenRead', icon: 'headphones', color: '#3b82f6' },
  { id: 'translate', labelKey: 'translate', icon: 'translate', color: '#6366f1' },
  { id: 'shadow', labelKey: 'shadowRead', icon: 'loop', color: '#d97706' },
  { id: 'record', labelKey: 'record', icon: 'mic', color: '#dc2626' },
  { id: 'assignments', labelKey: 'assignments', icon: 'clipboard', color: '#8b5cf6' },
];

function Icon({ name, color, active }) {
  const style = { color: active ? color : `${color}99` };
  switch (name) {
    case 'headphones':
      return (
        <svg style={style} width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 12V8a5 5 0 0 1 10 0v4" />
          <rect x="1" y="10" width="3" height="4" rx="1" />
          <rect x="12" y="10" width="3" height="4" rx="1" />
        </svg>
      );
    case 'translate':
      return (
        <svg style={style} width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3h7M5.5 1v2M3.5 3c0 2 1 4 4 5.5" />
          <path d="M7.5 3c0 1.5-.5 3-2 4.5" />
          <path d="M9 9l2.5 6M14 9l-2.5 6M9.75 13h3.5" />
        </svg>
      );
    case 'loop':
      return (
        <svg style={style} width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4" />
          <path d="M12.5 1v3h-3" />
          <path d="M3.5 15v-3h3" />
        </svg>
      );
    case 'mic':
      return (
        <svg style={style} width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="6" r="4" />
          <path d="M3 6a5 5 0 0 0 10 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg style={style} width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="2" width="10" height="13" rx="1.5" />
          <path d="M6 2V1.5a1.5 1.5 0 0 1 3 0V2" />
          <line x1="5.5" y1="6" x2="10.5" y2="6" />
          <line x1="5.5" y1="9" x2="10.5" y2="9" />
          <line x1="5.5" y1="12" x2="8.5" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ToolSetSelector({ active, onSelect, hasAudio, hasSyntaxGlosses, isEnrolled, assignmentCount = 0, l1 }) {
  const available = TOOL_SETS.filter(t => {
    if (t.id === 'assignments') return isEnrolled;
    if (t.id === 'translate') return hasSyntaxGlosses;
    if (!hasAudio) return t.id === 'record' || t.id === 'assignments';
    return true;
  });

  if (available.length <= 1) return null;

  return (
    <div
      className="grid gap-1 sm:gap-1.5"
      style={{ gridTemplateColumns: `repeat(${available.length}, minmax(0, 1fr))` }}
    >
      {available.map(tool => {
        const isActive = active === tool.id;
        const label = getUILabel(tool.labelKey, l1);
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            className={`relative flex flex-col items-center justify-center gap-1 px-1 sm:px-2 py-2 min-h-[56px] rounded-lg border transition-all ${
              isActive
                ? 'bg-white border-gray-300 shadow-sm'
                : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'
            }`}
            style={isActive ? { borderColor: `${tool.color}66`, backgroundColor: `${tool.color}08` } : undefined}
          >
            <Icon name={tool.icon} color={tool.color} active={isActive} />
            <span
              className="text-[10px] sm:text-xs font-medium leading-tight text-center"
              style={{ color: isActive ? tool.color : '#6b7280' }}
            >
              {label}
            </span>
            {tool.id === 'assignments' && assignmentCount > 0 && !isActive && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-violet-500 text-white text-[10px] font-bold px-1">
                {assignmentCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
