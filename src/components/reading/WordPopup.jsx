import { useEffect, useRef, useState } from 'react';
import { cefrColor, lookupCefr } from '../../lib/wordUtils';
import { spanishDict } from '../../data/es_dictionary';

export default function WordPopup({ word, cefr, lemma, via, position, onClose, onAddFlashcard, particle, manifest }) {
  const popupRef = useRef(null);
  const [adjusted, setAdjusted] = useState(position);
  const [view, setView] = useState(particle ? 'particle' : 'word');

  useEffect(() => {
    setView(particle ? 'particle' : 'word');
  }, [word, particle]);

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
  }, [position, view]);

  const lookupKey = lemma || word.toLowerCase();
  const manifestEntry = manifest?.entries?.[lookupKey] || manifest?.entries?.[word.toLowerCase()];
  const wordSpanish = manifestEntry?.spanish || spanishDict[lookupKey] || spanishDict[word.toLowerCase()];
  const wordLevel = cefr || 'unclassified';
  const wordColor = cefrColor(wordLevel);

  const particleLevel = particle?.cefr || 'unclassified';
  const particleColor = cefrColor(particleLevel);
  const particleSpanish = particle?.spanish;

  function constituentSpanish(token) {
    const key = token.lemma || token.raw.toLowerCase();
    if (particle?.constituents_es?.[key]) return particle.constituents_es[key];
    if (particle?.constituents_es?.[token.raw.toLowerCase()]) return particle.constituents_es[token.raw.toLowerCase()];
    const mEntry = manifest?.entries?.[key] || manifest?.entries?.[token.raw.toLowerCase()];
    if (mEntry?.spanish) return mEntry.spanish;
    return spanishDict[key] || spanishDict[token.raw.toLowerCase()] || null;
  }

  function renderParticleView() {
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-900">{particle.phrase}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: particleColor + '20', color: particleColor }}
          >
            {particleLevel === 'unclassified' ? '—' : particleLevel}
          </span>
        </div>

        {particle.compositionality && (
          <div className="text-xs text-gray-400 mb-2">
            {particle.compositionality === 'non-compositional'
              ? 'Meaning as a unit — not from individual words'
              : 'Compositional phrase'}
          </div>
        )}

        {particleSpanish ? (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">ES</span>
            <p className="text-sm text-gray-800 mt-0.5">{particleSpanish}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic mb-2">No translation available</p>
        )}

        {particle.note && (
          <p className="text-xs text-gray-500 italic mb-2">{particle.note}</p>
        )}

        <button
          onClick={() => setView('word')}
          className="text-xs text-blue-500 hover:text-blue-700 mb-1"
        >
          See individual words &darr;
        </button>
      </>
    );
  }

  function renderWordView() {
    const showBackLink = !!particle;

    if (showBackLink && particle.constituents && particle.constituents.length > 1) {
      return (
        <>
          <button
            onClick={() => setView('particle')}
            className="text-xs text-blue-500 hover:text-blue-700 mb-2 flex items-center gap-1"
          >
            &uarr; {particle.phrase}
          </button>

          <div className="space-y-2">
            {particle.constituents.map((c, i) => {
              const cLookup = lookupCefr(c.raw);
              const cLevel = cLookup.cefr || 'unclassified';
              const cColor = cefrColor(cLevel);
              const cSpanish = constituentSpanish(c);

              return (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900">{c.raw}</span>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: cColor + '20', color: cColor }}
                      >
                        {cLevel === 'unclassified' ? '—' : cLevel}
                      </span>
                    </div>
                    {cLookup.lemma && cLookup.lemma !== c.raw.toLowerCase() && (
                      <span className="text-xs text-gray-400">→ {cLookup.lemma}</span>
                    )}
                    {cSpanish ? (
                      <p className="text-sm text-gray-700 mt-0.5">{cSpanish}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-0.5">No translation</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    return (
      <>
        {showBackLink && (
          <button
            onClick={() => setView('particle')}
            className="text-xs text-blue-500 hover:text-blue-700 mb-2 flex items-center gap-1"
          >
            &uarr; {particle.phrase}
          </button>
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-900">{word}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: wordColor + '20', color: wordColor }}
          >
            {wordLevel === 'unclassified' ? '—' : wordLevel}
          </span>
        </div>

        {lemma && lemma !== word.toLowerCase() && (
          <div className="text-xs text-gray-400 mb-2">
            → {lemma}
          </div>
        )}

        {wordSpanish ? (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">ES</span>
            <p className="text-sm text-gray-800 mt-0.5">{wordSpanish}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No translation available</p>
        )}

        {manifestEntry?.note && (
          <p className="text-xs text-gray-500 italic mb-2">{manifestEntry.note}</p>
        )}
      </>
    );
  }

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[calc(100vw-16px)] sm:w-72"
      style={{ left: `${adjusted.x}px`, top: `${adjusted.y}px` }}
    >
      {view === 'particle' && renderParticleView()}
      {view === 'word' && renderWordView()}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={onAddFlashcard}
          className="text-xs text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium px-2 py-2 -mx-2 min-h-[44px] flex items-center"
        >
          + Flashcard
        </button>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 active:text-gray-800 px-2 py-2 -mr-2 min-h-[44px] flex items-center"
        >
          Close
        </button>
      </div>
    </div>
  );
}
