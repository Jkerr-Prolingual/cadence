import { useState, useEffect, useMemo } from 'react';
import { getAllSrsCards, getDueSrsCards } from '../../lib/srs';
import { cefrColor } from '../../lib/wordUtils';
import { supabase } from '../../lib/supabase';
import LeitnerReview from './LeitnerReview';
import BoxDistribution from '../shared/BoxDistribution';
import FlashcardSummaryStrip from './FlashcardSummaryStrip';

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
                {card.translation && (
                  <span className="text-xs text-gray-400 truncate hidden sm:inline">{card.translation}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400 hidden sm:inline">{card.cardType === 'cloze' ? 'cloze' : (card.l1 || 'es').toUpperCase()}</span>
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
  const [cardSources, setCardSources] = useState([]);
  const [textBookMap, setTextBookMap] = useState({});
  const [bookTitles, setBookTitles] = useState({});
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

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [sourcesRes, textsRes, booksRes] = await Promise.all([
          supabase.from('srs_card_sources').select('word, text_id, text_title').eq('user_id', user.id),
          supabase.from('curated_texts').select('id, book_id, chapter_order').eq('status', 'published'),
          supabase.from('books').select('id, title').eq('status', 'published'),
        ]);
        setCardSources(sourcesRes.data || []);
        const tbMap = {};
        for (const t of (textsRes.data || [])) {
          if (t.book_id) tbMap[t.id] = { bookId: t.book_id, order: t.chapter_order ?? 0 };
        }
        setTextBookMap(tbMap);
        const btMap = {};
        for (const b of (booksRes.data || [])) btMap[b.id] = b.title;
        setBookTitles(btMap);
      }
    } catch {}
    setLoading(false);
  }

  const folders = useMemo(() => {
    const map = {};
    const cardsByWord = {};
    for (const card of allCards) {
      cardsByWord[card.word] = card;
    }
    const dueWords = new Set(dueCards.map(c => c.word));

    // Build folders from srs_card_sources (multi-chapter aware)
    const sourcedWords = new Set();
    for (const src of cardSources) {
      sourcedWords.add(src.word);
      const key = src.text_id;
      if (!map[key]) {
        map[key] = {
          textId: src.text_id,
          title: src.text_title || 'Untitled',
          cards: [],
          dueCount: 0,
        };
      }
      const card = cardsByWord[src.word];
      if (card) {
        map[key].cards.push(card);
        if (dueWords.has(card.word)) map[key].dueCount++;
      }
    }

    // Cards without sources go to their text_id folder or _unassigned
    for (const card of allCards) {
      if (sourcedWords.has(card.word)) continue;
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
      if (dueWords.has(card.word)) map[key].dueCount++;
    }

    return Object.entries(map)
      .sort(([a], [b]) => {
        if (a === '_unassigned') return 1;
        if (b === '_unassigned') return -1;
        const aInfo = textBookMap[a];
        const bInfo = textBookMap[b];
        if (aInfo && bInfo) {
          if (aInfo.bookId !== bInfo.bookId) return aInfo.bookId.localeCompare(bInfo.bookId);
          return aInfo.order - bInfo.order;
        }
        return 0;
      })
      .map(([key, val]) => ({ key, ...val }));
  }, [allCards, dueCards, cardSources, textBookMap]);

  const bookGroups = useMemo(() => {
    const groups = {};
    for (const folder of folders) {
      const info = textBookMap[folder.key];
      const bookId = info?.bookId || '_no_book';
      if (!groups[bookId]) {
        groups[bookId] = {
          bookId,
          title: bookTitles[bookId] || null,
          folders: [],
        };
      }
      groups[bookId].folders.push(folder);
    }
    return Object.values(groups);
  }, [folders, textBookMap, bookTitles]);

  const hasMultipleBooks = bookGroups.filter(g => g.bookId !== '_no_book').length > 1;

  const filteredCards = useMemo(() => {
    if (selectedFolder === 'all') return allCards;
    const folder = folders.find(f => f.key === selectedFolder);
    return folder ? folder.cards : [];
  }, [selectedFolder, allCards, folders]);

  const filteredDueCount = useMemo(() => {
    if (selectedFolder === 'all') return dueCards.length;
    const folder = folders.find(f => f.key === selectedFolder);
    return folder ? folder.dueCount : 0;
  }, [selectedFolder, dueCards, folders]);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
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

        <FlashcardSummaryStrip allCards={allCards} dueCards={dueCards} />

        {/* Folder tabs — grouped by book when multiple books exist */}
        {folders.length > 1 && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
            </div>
            {hasMultipleBooks ? (
              bookGroups.map(group => (
                <div key={group.bookId}>
                  {group.title && (
                    <p className="text-xs font-medium text-gray-400 mb-1.5 px-1">{group.title}</p>
                  )}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {group.folders.map(folder => (
                      <FolderTab
                        key={folder.key}
                        folder={folder}
                        selected={selectedFolder === folder.key}
                        onSelect={() => setSelectedFolder(folder.key)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {folders.map(folder => (
                  <FolderTab
                    key={folder.key}
                    folder={folder}
                    selected={selectedFolder === folder.key}
                    onSelect={() => setSelectedFolder(folder.key)}
                  />
                ))}
              </div>
            )}
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

function FolderTab({ folder, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`flex-shrink-0 px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors border ${
        selected
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
  );
}
