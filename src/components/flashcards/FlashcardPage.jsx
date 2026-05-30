import { useState, useEffect, useMemo } from 'react';
import { getAllSrsCards, getDueSrsCards } from '../../lib/srs';
import { cefrColor } from '../../lib/wordUtils';
import LeitnerReview from './LeitnerReview';

function BoxDistribution({ cards }) {
  const boxes = [1, 2, 3, 4, 5];
  const counts = boxes.map(b => cards.filter(c => c.box === b).length);
  const max = Math.max(...counts, 1);

  return (
    <div className="flex items-end gap-2 h-24">
      {boxes.map((box, i) => (
        <div key={box} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{counts[i]}</span>
          <div
            className="w-full bg-gray-200 rounded-t"
            style={{
              height: `${Math.max((counts[i] / max) * 100, 4)}%`,
              backgroundColor: counts[i] > 0
                ? ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'][i]
                : '#e5e7eb',
            }}
          />
          <span className="text-xs text-gray-400">{box}</span>
        </div>
      ))}
    </div>
  );
}

function CardList({ cards }) {
  if (cards.length === 0) return null;

  const sorted = [...cards].sort((a, b) => (a.box || 1) - (b.box || 1));

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">All cards</h3>
      <div className="space-y-1">
        {sorted.map(card => {
          const color = cefrColor(card.cefr);
          return (
            <div key={card.word} className="flex items-center justify-between py-2.5 sm:py-2 px-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="text-sm text-gray-900 truncate">{card.front || card.word}</span>
                {card.spanish && (
                  <span className="text-xs text-gray-400 truncate hidden sm:inline">{card.spanish}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400 hidden sm:inline">{card.cardType === 'cloze' ? 'cloze' : 'ES'}</span>
                <span className="text-xs text-gray-400">Box {card.box || 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FlashcardPage() {
  const [allCards, setAllCards] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState('all');

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      const [all, due] = await Promise.all([getAllSrsCards(), getDueSrsCards()]);
      setAllCards(all);
      setDueCards(due);
    } catch {}
    setLoading(false);
  }

  const folders = useMemo(() => {
    const map = {};
    for (const card of allCards) {
      const key = card.textId || '_unassigned';
      if (!map[key]) {
        map[key] = {
          textId: card.textId || null,
          title: card.textTitle || 'Unassigned',
          cards: [],
          dueCount: 0,
        };
      }
      map[key].cards.push(card);
    }
    for (const card of dueCards) {
      const key = card.textId || '_unassigned';
      if (map[key]) map[key].dueCount++;
    }
    return Object.entries(map)
      .sort(([a], [b]) => {
        if (a === '_unassigned') return 1;
        if (b === '_unassigned') return -1;
        return 0;
      })
      .map(([key, val]) => ({ key, ...val }));
  }, [allCards, dueCards]);

  const filteredCards = selectedFolder === 'all'
    ? allCards
    : allCards.filter(c => (c.textId || '_unassigned') === selectedFolder);

  const filteredDueCount = selectedFolder === 'all'
    ? dueCards.length
    : dueCards.filter(c => (c.textId || '_unassigned') === selectedFolder).length;

  const reviewTextId = selectedFolder === 'all' ? undefined : (selectedFolder === '_unassigned' ? null : selectedFolder);

  function handleReviewComplete() {
    setReviewing(false);
    loadCards();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (reviewing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <LeitnerReview
          onComplete={handleReviewComplete}
          textId={reviewTextId}
        />
      </div>
    );
  }

  if (allCards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm font-medium text-gray-600">No flashcards yet.</p>
          <p className="text-xs mt-2 max-w-xs mx-auto">
            Click any word while reading, then tap "+ Flashcard" to add it to your review deck.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Flashcards</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} · {filteredDueCount} due for review
            </p>
          </div>
          <button
            onClick={() => setReviewing(true)}
            disabled={filteredDueCount === 0}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              filteredDueCount > 0
                ? 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Review ({filteredDueCount})
          </button>
        </div>

        {/* Folder tabs */}
        {folders.length > 1 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedFolder('all')}
              className={`flex-shrink-0 px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors border ${
                selectedFolder === 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 active:bg-gray-50'
              }`}
            >
              All ({allCards.length})
            </button>
            {folders.map(folder => (
              <button
                key={folder.key}
                onClick={() => setSelectedFolder(folder.key)}
                className={`flex-shrink-0 px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors border ${
                  selectedFolder === folder.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 active:bg-gray-50'
                }`}
              >
                {folder.title}
                <span className="ml-1.5 text-xs opacity-70">
                  {folder.cards.length}
                  {folder.dueCount > 0 && (
                    <span className="ml-1 text-amber-500 font-semibold">{folder.dueCount} due</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Single folder — show title as header instead of tabs */}
        {folders.length === 1 && folders[0].textId && (
          <p className="text-xs text-gray-400 mb-4">
            From: {folders[0].title}
          </p>
        )}

        <BoxDistribution cards={filteredCards} />
        <CardList cards={filteredCards} />
      </div>
    </div>
  );
}
