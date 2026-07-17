import { useEffect, useRef, useState } from 'react';
import { cefrColor, lookupCefr } from '../../lib/wordUtils';
import { lemmaMap } from '../../data/lemmaMap';
import { egpLookup } from '../../data/egpLookup';
import { egpL1Overlays } from '../../data/egpL1Overlays';
import { getL1Dict, getManifestTranslation, getManifestConstituents, getGlossTranslation, getGlossConstituents } from '../../lib/translations';
import { getL1Label } from '../../lib/locales';

export default function WordPopup({ word, cefr, lemma, via, position, onClose, onResumeAudio, onAddFlashcard, particle, manifest, structure, syntaxGloss, l1 = 'es' }) {
  const popupRef = useRef(null);
  const [adjusted, setAdjusted] = useState(position);
  const [view, setView] = useState(syntaxGloss ? 'gloss' : particle ? 'particle' : structure ? 'structure' : 'word');
  const [structureDrillDown, setStructureDrillDown] = useState(false);

  useEffect(() => {
    setView(syntaxGloss ? 'gloss' : particle ? 'particle' : structure ? 'structure' : 'word');
    setStructureDrillDown(false);
  }, [word, particle, structure, syntaxGloss]);

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
  }, [position, view, structureDrillDown, syntaxGloss]);

  const l1Dict = getL1Dict(l1);
  const l1Label = getL1Label(l1);
  const lookupKey = lemma || word.toLowerCase();
  const morphLemma = lemmaMap[word.toLowerCase()];
  const manifestEntry = manifest?.entries?.[lookupKey] || manifest?.entries?.[word.toLowerCase()] || (morphLemma && manifest?.entries?.[morphLemma]);
  const wordTranslation = getManifestTranslation(manifestEntry, l1) || l1Dict[lookupKey] || l1Dict[word.toLowerCase()] || (morphLemma && l1Dict[morphLemma]);
  const wordLevel = cefr || 'unclassified';
  const wordColor = cefrColor(wordLevel);

  const particleLevel = particle?.cefr || 'unclassified';
  const particleColor = cefrColor(particleLevel);
  const particleTranslation = particle?.translations?.[l1] || particle?.spanish || null;
  const particleConstituents = particle?.constituents_l1?.[l1] || particle?.constituents_es || null;

  function constituentTranslation(token) {
    const key = token.lemma || token.raw.toLowerCase();
    const mLemma = lemmaMap[token.raw.toLowerCase()];
    if (particleConstituents?.[key]) return particleConstituents[key];
    if (particleConstituents?.[token.raw.toLowerCase()]) return particleConstituents[token.raw.toLowerCase()];
    const mEntry = manifest?.entries?.[key] || manifest?.entries?.[token.raw.toLowerCase()] || (mLemma && manifest?.entries?.[mLemma]);
    const mTranslation = getManifestTranslation(mEntry, l1);
    if (mTranslation) return mTranslation;
    return l1Dict[key] || l1Dict[token.raw.toLowerCase()] || (mLemma && l1Dict[mLemma]) || null;
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

        {particleTranslation ? (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{l1Label}</span>
            <p className="text-sm text-gray-800 mt-0.5">{particleTranslation}</p>
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
              const cSpanish = constituentTranslation(c);

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

        {wordTranslation ? (
          <div className="mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{l1Label}</span>
            <p className="text-sm text-gray-800 mt-0.5">{wordTranslation}</p>
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

  function renderStructureView() {
    const egp = structure?.egp || egpLookup[structure?.egp_id];
    if (!egp) return null;
    const overlay = egpL1Overlays[String(structure.egp_id)];
    const sLevel = structure.override_cefr || egp.level;
    const sColor = cefrColor(sLevel);

    if (structureDrillDown && overlay) {
      return (
        <>
          <button
            onClick={() => setStructureDrillDown(false)}
            className="text-xs text-blue-500 hover:text-blue-700 mb-2 flex items-center gap-1"
          >
            &larr; Back
          </button>

          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-gray-900">{overlay.pattern}</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
              style={{ backgroundColor: sColor + '20', color: sColor }}
            >
              {sLevel}
            </span>
          </div>

          {overlay.explanations?.[l1] && (
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{l1Label}</span>
              <p className="text-sm text-gray-800 mt-0.5">{overlay.explanations[l1]}</p>
            </div>
          )}

          {overlay.contrasts?.[l1] && (
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{l1Label} vs EN</span>
              <p className="text-sm text-gray-800 mt-0.5">{overlay.contrasts[l1]}</p>
            </div>
          )}

          {overlay.examples?.[l1]?.length > 0 && (
            <div className="mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Examples</span>
              <div className="mt-1 space-y-1.5">
                {overlay.examples[l1].map((ex, i) => (
                  <div key={i} className="text-xs">
                    <p className="text-gray-800">{ex.en}</p>
                    <p className="text-gray-500 italic">{ex.l1}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-gray-900">
            {overlay?.pattern || egp.guideword}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
            style={{ backgroundColor: sColor + '20', color: sColor }}
          >
            {sLevel}
          </span>
        </div>

        {!overlay && (
          <p className="text-sm text-gray-700 mb-2">{egp.canDo}</p>
        )}

        {overlay && (
          <button
            onClick={() => setStructureDrillDown(true)}
            className="text-xs text-blue-500 hover:text-blue-700 mb-1"
          >
            Learn more &rsaquo;
          </button>
        )}
      </>
    );
  }

  function renderGlossView() {
    if (!syntaxGloss) return null;

    return (
      <>
        <div className="mb-2">
          <p className="text-sm text-gray-600 italic leading-snug">"{syntaxGloss.text}"</p>
        </div>

        <div className="mb-2">
          <p className="text-sm text-gray-800">{getGlossTranslation(syntaxGloss, l1)}</p>
        </div>

        {syntaxGloss.note && (
          <p className="text-xs text-gray-500 italic mb-2">{syntaxGloss.note}</p>
        )}

        {getGlossConstituents(syntaxGloss, l1) && Object.keys(getGlossConstituents(syntaxGloss, l1)).length > 0 && (
          <button
            onClick={() => setView('gloss-constituents')}
            className="text-xs text-blue-500 hover:text-blue-700 mb-1"
          >
            See individual words &darr;
          </button>
        )}
      </>
    );
  }

  function renderGlossConstituentsView() {
    const glossConstituents = getGlossConstituents(syntaxGloss, l1);
    if (!glossConstituents) return null;
    const textLower = syntaxGloss.text.toLowerCase();
    const entries = Object.entries(glossConstituents)
      .sort((a, b) => textLower.indexOf(a[0].toLowerCase()) - textLower.indexOf(b[0].toLowerCase()));

    return (
      <>
        <button
          onClick={() => setView('gloss')}
          className="text-xs text-blue-500 hover:text-blue-700 mb-2 flex items-center gap-1"
        >
          &uarr; Back to phrase
        </button>

        <div className="space-y-2">
          {entries.map(([key, translation], i) => {
            const lookup = lookupCefr(key.split(/\s+/)[0]);
            const level = lookup.cefr || 'unclassified';
            const color = cefrColor(level);
            return (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-900">{key}</span>
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: color + '20', color }}
                    >
                      {level === 'unclassified' ? '—' : level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{translation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[calc(100vw-16px)] sm:w-72 overflow-y-auto"
      style={{ left: `${adjusted.x}px`, top: `${adjusted.y}px`, maxHeight: 'calc(100vh - 16px)' }}
    >
      {view === 'gloss' && renderGlossView()}
      {view === 'gloss-constituents' && renderGlossConstituentsView()}
      {view === 'particle' && renderParticleView()}
      {view === 'structure' && renderStructureView()}
      {view === 'word' && renderWordView()}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={onAddFlashcard}
          className="text-xs text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium px-2 py-2 -mx-2 min-h-[44px] flex items-center"
        >
          {view === 'structure' ? '+ Cloze card' : '+ Flashcard'}
        </button>
        <div className="flex items-center gap-1">
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
