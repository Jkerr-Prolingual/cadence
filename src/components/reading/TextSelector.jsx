import { useRef, useState, useEffect } from 'react';
import { cefrColor } from '../../lib/wordUtils';

export default function TextSelector({ texts, selectedId, onSelect }) {
  const scrollRef = useRef(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function check() {
      setCanScroll({
        left: el.scrollLeft > 4,
        right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
      });
    }
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [texts]);

  return (
    <div className="relative border-b border-gray-100">
      {canScroll.left && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      )}
      {canScroll.right && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      )}
      <div
        ref={scrollRef}
        className="px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none"
      >
        {texts.map((t) => {
          const active = t.id === selectedId;
          const color = cefrColor(t.cefr);
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`flex-shrink-0 px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors border min-h-[40px] ${
                active
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 active:bg-gray-50'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: color }}
              />
              <span className="max-w-[200px] truncate inline-block align-middle">{t.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
