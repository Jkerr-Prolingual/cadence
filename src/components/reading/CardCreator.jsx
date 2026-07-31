import { useState, useRef } from 'react';
import { upsertSrsCard } from '../../lib/srs';
import { cefrColor } from '../../lib/wordUtils';
import { searchImages } from '../../lib/imageSearch';
import { getL1Dict } from '../../lib/translations';
import { getL1EnglishLabel, getUILabel } from '../../lib/locales';

function ImagePicker({ initialQuery, selectedUrl, onSelect }) {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchImages(query, 8);
      setImages(results);
      if (results.length === 0) setError('No images found.');
    } catch (e) {
      setError(e.message === 'Pixabay API key not configured'
        ? 'Set VITE_PIXABAY_API_KEY in .env.local to enable image search.'
        : 'Image search failed.');
    } finally {
      setLoading(false);
    }
  }

  if (selectedUrl) {
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Image</span>
          <button onClick={() => onSelect(null, null)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
        </div>
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-gray-200">
          <img src={selectedUrl} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => { onSelect(null, null); setOpen(true); }}
            className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded hover:bg-black/70"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-lg py-2.5 text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + Add image
        </button>
      ) : (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex gap-2 mb-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search images..."
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button
              onClick={doSearch}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          {images.length > 0 && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { onSelect(img.url, img.attribution); setOpen(false); }}
                    className="flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all"
                  >
                    <img src={img.thumbnail || img.url} alt={img.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Images via <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Pixabay</a> (free license)
              </p>
            </>
          )}
          <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-2">Cancel</button>
        </div>
      )}
    </div>
  );
}

export default function CardCreator({ word, lemma, cefr, sentence, textId, textTitle, onClose, onCreated, isStructure = false, structureData = null, l1 = 'es' }) {
  const [step, setStep] = useState(isStructure ? 'build' : 'type');
  const [cardType, setCardType] = useState(isStructure ? 'cloze' : null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState(isStructure && structureData ? structureData.phrase : '');
  const [imageUrl, setImageUrl] = useState(null);
  const [imageAttribution, setImageAttribution] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [phraseSelection, setPhraseSelection] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const phraseRef = useRef(null);

  const lookupKey = lemma || word.toLowerCase();
  const l1Dict = getL1Dict(l1);
  const l1EnglishLabel = getL1EnglishLabel(l1);
  const translation = l1Dict[lookupKey] || l1Dict[word.toLowerCase()] || '';
  const color = cefrColor(cefr);

  function handleChooseType(type) {
    setCardType(type);
    if (type === 'translation') {
      setFront(word);
      setBack(translation);
    } else {
      setFront('');
      setBack(word);
    }
    setStep('build');
  }

  function handlePhraseMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const selected = sel.toString().trim();
    if (!selected) return;

    const wordCount = selected.split(/\s+/).filter(Boolean).length;
    if (wordCount < 3) { setSelectionError(getUILabel('selectAtLeast3', l1)); return; }
    if (wordCount > 15) { setSelectionError(getUILabel('keepUnder15', l1)); return; }
    if (!isStructure && !selected.toLowerCase().includes(word.toLowerCase())) {
      setSelectionError(`${getUILabel('mustInclude', l1)} "${word}".`);
      return;
    }

    setSelectionError('');
    if (isStructure) {
      setFront(sentence.replace(selected, '_____'));
      setBack(selected);
      setPhraseSelection(selected);
      sel.removeAllRanges();
      return;
    } else {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      setFront(selected.replace(regex, '_____'));
    }
    setPhraseSelection(selected);
    sel.removeAllRanges();
  }

  async function handleSave() {
    if (!front.trim() || !back.trim()) return;
    const srsWord = isStructure && structureData ? `egp_${structureData.egp_id}` : lookupKey;
    const srsCardType = isStructure ? 'structure_cloze' : cardType;
    const result = await upsertSrsCard({
      word: srsWord,
      front: front.trim(),
      back: back.trim(),
      cardType: srsCardType,
      cefr,
      translation: cardType === 'translation' ? back.trim() : translation,
      l1,
      imageUrl,
      imageAttribution,
      textId: textId || null,
      textTitle: textTitle || null,
      box: 1,
      nextReviewDate: Date.now(),
      createdAt: Date.now(),
    });
    setSaved(true);
    if (result && !result.isNew && result.existingTextTitle && result.existingTextTitle !== textTitle) {
      setSaveMessage(`Added to existing card from "${result.existingTextTitle}"`);
    }
    onCreated?.();
    setTimeout(onClose, result && !result.isNew ? 1200 : 600);
  }

  const canSave = front.trim() && back.trim();

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
           style={{ maxHeight: '85dvh', overflowY: 'auto' }}>

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {step === 'build' && !isStructure && (
              <button onClick={() => { setStep('type'); setImageUrl(null); setImageAttribution(null); }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none">‹</button>
            )}
            <span className="font-semibold text-sm text-gray-800">
              {isStructure ? getUILabel('addGrammarCard', l1) : `${getUILabel('addFlashcardFor', l1)} — "${word}"`}
            </span>
            {cefr && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: color + '20', color }}>
                {cefr}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <div className="p-4">

          {step === 'type' && (
            <div className="space-y-2">
              <button
                onClick={() => handleChooseType('translation')}
                className="w-full flex items-start gap-3 px-4 py-4 sm:py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-all text-left"
              >
                <span className="text-xl mt-0.5">{l1.toUpperCase()}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{getUILabel('wordTranslationType', l1)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{getUILabel('wordTranslationDesc', l1)}</div>
                </div>
              </button>
              <button
                onClick={() => handleChooseType('cloze')}
                disabled={!sentence}
                className="w-full flex items-start gap-3 px-4 py-4 sm:py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-xl mt-0.5">___</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{getUILabel('clozeDeletion', l1)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{getUILabel('clozeDeletionDesc', l1)}</div>
                </div>
              </button>
            </div>
          )}

          {step === 'build' && cardType === 'translation' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Front</label>
                <input
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Back ({l1EnglishLabel})</label>
                <input
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  placeholder={`${l1EnglishLabel} translation...`}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {!back && (
                  <p className="text-xs text-gray-400 mt-1">{getUILabel('noTranslationHint', l1)}</p>
                )}
              </div>
              <ImagePicker
                initialQuery={word}
                selectedUrl={imageUrl}
                onSelect={(url, attr) => { setImageUrl(url); setImageAttribution(attr); }}
              />
              <button
                onClick={handleSave}
                disabled={!canSave || saved}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  saved ? 'bg-green-500 text-white'
                    : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {saved ? (saveMessage || 'Saved!') : getUILabel('addToReviewDeck', l1)}
              </button>
            </div>
          )}

          {step === 'build' && cardType === 'cloze' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {isStructure
                    ? getUILabel('highlightPart', l1)
                    : <>{getUILabel('highlightPhrase', l1)} <strong className="text-gray-800">"{word}"</strong></>
                  }
                </p>
                <div
                  ref={phraseRef}
                  onMouseUp={handlePhraseMouseUp}
                  onTouchEnd={handlePhraseMouseUp}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700 leading-relaxed cursor-text"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                >
                  {sentence}
                </div>
                {selectionError && (
                  <p className="text-xs text-red-500 mt-1">{selectionError}</p>
                )}
                {phraseSelection && (
                  <p className="text-xs text-green-600 mt-1">Selected: "{phraseSelection}"</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Front (cloze)</label>
                <textarea
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  rows={2}
                  placeholder="Highlight text above..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Back (answer)</label>
                <input
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <ImagePicker
                initialQuery={word}
                selectedUrl={imageUrl}
                onSelect={(url, attr) => { setImageUrl(url); setImageAttribution(attr); }}
              />
              <button
                onClick={handleSave}
                disabled={!canSave || saved}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  saved ? 'bg-green-500 text-white'
                    : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {saved ? (saveMessage || 'Saved!') : getUILabel('addToReviewDeck', l1)}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
