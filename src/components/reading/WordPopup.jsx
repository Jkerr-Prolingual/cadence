import { useEffect, useRef, useState } from 'react';
import { cefrColor } from '../../lib/wordUtils';
import { spanishDict } from '../../data/es_dictionary';

export default function WordPopup({ word, cefr, lemma, via, position, onClose, onAddFlashcard, hasAudio, onResume, onLoopSentence }) {
  const popupRef = useRef(null);
  const [adjusted, setAdjusted] = useState(position);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (!popupRef.current || !position) return;
    const el = popupRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.visualViewport?.height || window.innerHeight;
    const pad = 8;
    let { x, y } = position;
    if (x + rect.width > vw - pad) {
      x = vw - rect.width - pad;
    }
    if (x < pad) x = pad;
    if (y + rect.height > vh - pad) {
      y = position.y - rect.height - 8;
    }
    if (y < pad) y = pad;
    setAdjusted({ x, y });
  }, [position]);

  const lookupKey = lemma || word.toLowerCase();
  const spanish = spanishDict[lookupKey] || spanishDict[word.toLowerCase()];
  const level = cefr || 'unclassified';
  const color = cefrColor(level);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[calc(100vw-16px)] sm:w-72"
      style={{ left: `${adjusted.x}px`, top: `${adjusted.y}px` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-semibold text-gray-900">{word}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: color + '20', color }}
        >
          {level === 'unclassified' ? '—' : level}
        </span>
      </div>

      {lemma && lemma !== word.toLowerCase() && (
        <div className="text-xs text-gray-400 mb-2">
          → {lemma}
        </div>
      )}

      {spanish ? (
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">ES</span>
          <p className="text-sm text-gray-800 mt-0.5">{spanish}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No translation available</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={onAddFlashcard}
            className="text-xs text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium px-2 py-2 -mx-2 min-h-[44px] flex items-center"
          >
            + Flashcard
          </button>
          {hasAudio && onLoopSentence && (
            <button
              onClick={onLoopSentence}
              className="text-xs text-amber-600 hover:text-amber-800 active:text-amber-900 font-medium px-2 py-2 min-h-[44px] flex items-center"
            >
              Loop sentence
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasAudio && onResume && (
            <button
              onClick={onResume}
              className="text-xs text-green-600 hover:text-green-800 active:text-green-900 font-medium px-2 py-2 min-h-[44px] flex items-center"
            >
              Resume
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 active:text-gray-800 px-2 py-2 -mr-2 min-h-[44px] flex items-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
