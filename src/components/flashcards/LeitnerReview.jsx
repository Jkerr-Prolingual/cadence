import { useState, useEffect } from 'react';
import { getDueSrsCards, getAllSrsCards, reviewSrsCard, logReviewEvent } from '../../lib/srs';
import { cefrColor } from '../../lib/wordUtils';
import { getUILabel } from '../../lib/locales';
import { useAuth } from '../../context/AuthContext';

const RESPONSE_BUTTONS = [
  { score: 5, bg: 'bg-green-600 text-white border-green-500' },
  { score: 4, bg: 'bg-green-100 text-green-800 border-green-400' },
  { score: 3, bg: 'bg-amber-50 text-amber-800 border-amber-400' },
  { score: 2, bg: 'bg-orange-50 text-orange-800 border-orange-300' },
  { score: 1, bg: 'bg-gray-100 text-gray-600 border-gray-300' },
  { score: 0, bg: 'bg-gray-50 text-gray-400 border-gray-200' },
];

function ReviewCard({ card, onResponse, l1 }) {
  const [flipped, setFlipped] = useState(false);
  const color = cefrColor(card.cefr);
  const isCloze = card.cardType === 'cloze';
  const frontText = card.front || card.word;
  const backText = card.back || card.translation || card.english || '(no definition)';

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>Box {card.box} of 5</span>
        {card.cefr && (
          <>
            <span>·</span>
            <span style={{ color }}>{card.cefr}</span>
          </>
        )}
        <span>·</span>
        <span>{isCloze ? 'cloze' : (card.l1 || l1 || 'es').toUpperCase()}</span>
      </div>

      <div
        onClick={() => !flipped && setFlipped(true)}
        className="w-full max-w-md cursor-pointer"
        style={{ perspective: 800 }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '60%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          <div
            style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            }}
            className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            {card.imageUrl && (
              <img src={card.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            )}
            <p className={`font-semibold text-gray-800 text-center relative ${isCloze ? 'text-base leading-relaxed' : 'text-2xl'}`}>
              {frontText}
            </p>
            <span className="text-xs text-gray-400 absolute bottom-3">{getUILabel('tapToReveal', l1)}</span>
          </div>

          <div
            style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="bg-blue-50 rounded-2xl shadow-lg border border-blue-200 flex flex-col items-center justify-center p-6 gap-2 overflow-hidden"
          >
            {card.imageUrl && (
              <img src={card.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            )}
            <p className="text-lg font-semibold text-blue-900 text-center relative">{backText}</p>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="w-full max-w-md space-y-2">
          <p className="text-xs text-gray-400 text-center mb-3">{getUILabel('howWellKnewIt', l1)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RESPONSE_BUTTONS.map(({ score, bg }) => (
              <button
                key={score}
                onClick={() => onResponse(score)}
                className={`px-2 py-3 rounded-xl border-2 text-center transition-colors hover:opacity-90 active:opacity-80 ${bg}`}
              >
                <div className="text-sm font-semibold">{getUILabel(`srsScore${score}`, l1)}</div>
                <div className="text-xs opacity-75 mt-0.5">{getUILabel(`srsScore${score}Sub`, l1)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeitnerReview({ onComplete, textId }) {
  const { l1 } = useAuth();
  const [cards, setCards] = useState(null);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState('review');
  const [dueTomorrow, setDueTomorrow] = useState(0);
  const [reviewAll, setReviewAll] = useState(false);

  useEffect(() => {
    getDueSrsCards(textId)
      .then(due => setCards(due))
      .catch(() => setCards([]));
  }, [textId]);

  async function handleReviewAll() {
    setCards(null);
    try {
      const all = await getAllSrsCards(textId);
      setReviewAll(true);
      setCards(all);
      setIdx(0);
      setResults([]);
      setPhase('review');
    } catch {
      setCards([]);
    }
  }

  async function handleResponse(score) {
    const card = cards[idx];
    const result = await reviewSrsCard(card.word, score).catch(() => null);

    await logReviewEvent({
      word: card.word,
      response: score,
      boxBefore: card.box,
      boxAfter: result?.boxAfter ?? card.box,
    }).catch(() => {});

    const newResults = [...results, { word: card.word, score }];
    setResults(newResults);

    if (idx + 1 >= cards.length) {
      try {
        const allCards = await getAllSrsCards();
        const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
        setDueTomorrow(allCards.filter(c => c.nextReviewDate <= tomorrow).length);
      } catch {}
      setPhase('summary');
    } else {
      setIdx(i => i + 1);
    }
  }

  if (cards === null) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading review deck...
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm font-medium text-gray-600">{getUILabel('noCardsDue', l1)}</p>
        <p className="text-xs mt-2 max-w-xs mx-auto">
          {getUILabel('noCardsDueHint', l1)}
        </p>
        <button
          onClick={handleReviewAll}
          className="mt-6 px-5 py-2.5 rounded-xl border border-gray-300 bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
        >
          {getUILabel('reviewAllAnyway', l1)}
        </button>
      </div>
    );
  }

  if (phase === 'summary') {
    const advancing = results.filter(r => r.score >= 4).length;
    const held = results.filter(r => r.score === 3).length;
    const struggling = results.filter(r => r.score <= 2).length;

    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-xl font-bold text-gray-900">{getUILabel('reviewComplete', l1)}</div>
          <div className="text-sm text-gray-500 mt-1">
            {cards.length} {getUILabel('cardsReviewed', l1)}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {advancing > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-sm font-medium text-green-800">
                {advancing} {getUILabel('wordsMovingUp', l1)}
              </span>
              <span className="text-green-600 font-bold text-lg">↑</span>
            </div>
          )}
          {held > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-sm font-medium text-amber-800">
                {held} {getUILabel('wordsHolding', l1)}
              </span>
              <span className="text-amber-500 font-bold text-lg">=</span>
            </div>
          )}
          {struggling > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-600">
                {struggling} {getUILabel('wordsNeedPractice', l1)}
              </span>
              <span className="text-gray-400 font-bold text-lg">↓</span>
            </div>
          )}
          {dueTomorrow > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-sm font-medium text-blue-800">
                {dueTomorrow} {getUILabel('cardsDueTomorrow', l1)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => onComplete(results.map(r => r.word))}
          className="w-full px-4 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  const currentCard = cards[idx];

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-gray-900 h-1.5 rounded-full transition-all"
            style={{ width: `${(idx / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{idx + 1} / {cards.length}</span>
      </div>

      <ReviewCard
        key={currentCard.word}
        card={currentCard}
        onResponse={handleResponse}
        l1={l1}
      />
    </div>
  );
}
