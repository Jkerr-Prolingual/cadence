import { useState, useEffect, useMemo } from 'react';
import { getAllSrsCards, getDueSrsCards, deleteSrsCard, updateSrsCard } from '../../lib/srs';
import { cefrColor } from '../../lib/wordUtils';
import { supabase } from '../../lib/supabase';
import { getUILabel } from '../../lib/locales';
import { useAuth } from '../../context/AuthContext';
import LeitnerReview from './LeitnerReview';
import BoxDistribution from '../shared/BoxDistribution';
import FlashcardSummaryStrip from './FlashcardSummaryStrip';

function CardList({ cards, dueWords, l1, onDelete, onUpdate, selectMode, selectedWords, onToggleSelect }) {
  if (cards.length === 0) return (
    <div className="mt-6 text-center py-8 text-gray-400 text-sm">No cards match this filter.</div>
  );

  const sorted = [...cards].sort((a, b) => (a.box || 1) - (b.box || 1));

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        {getUILabel('allCards', l1)} ({cards.length})
      </h3>
      <div className="space-y-1">
        {sorted.map(card => (
          <CardRow
            key={card.word}
            card={card}
            isDue={dueWords.has(card.word)}
            onDelete={onDelete}
            onUpdate={onUpdate}
            selectMode={selectMode}
            selected={selectedWords.has(card.word)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}

function CardRow({ card, isDue, onDelete, onUpdate, selectMode, selected, onToggleSelect }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFront, setEditFront] = useState(card.front || card.word);
  const [editBack, setEditBack] = useState(card.back || card.translation || '');
  const [saving, setSaving] = useState(false);

  const color = cefrColor(card.cefr);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSrsCard(card.word);
      onDelete(card.word);
    } catch (err) {
      console.error('Failed to delete card:', err);
      setDeleting(false);
      setConfirming(false);
    }
  }

  async function handleSaveEdit() {
    if (!editFront.trim() || !editBack.trim()) return;
    setSaving(true);
    try {
      await updateSrsCard(card.word, {
        front: editFront.trim(),
        back: editBack.trim(),
        translation: editBack.trim(),
      });
      onUpdate(card.word, { front: editFront.trim(), back: editBack.trim(), translation: editBack.trim() });
      setEditing(false);
    } catch (err) {
      console.error('Failed to update card:', err);
    }
    setSaving(false);
  }

  if (editing) {
    return (
      <div className="py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
        <div>
          <label className="text-xs text-gray-500">Front</label>
          <input
            value={editFront}
            onChange={e => setEditFront(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Back</label>
          <input
            value={editBack}
            onChange={e => setEditBack(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={saving || !editFront.trim() || !editBack.trim()}
            className="text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 px-3 py-1 rounded disabled:opacity-40"
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2.5 sm:py-2 px-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 gap-2">
      {selectMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(card.word)}
          className="flex-shrink-0 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
        />
      )}
      <div
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        onClick={() => !selectMode && setEditing(true)}
      >
        {card.imageUrl ? (
          <img src={card.imageUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        )}
        <span className="text-sm text-gray-900 truncate">{card.front || card.word}</span>
        {card.translation && (
          <span className="text-xs text-gray-400 truncate hidden sm:inline">{card.translation}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isDue && <span className="text-xs text-amber-500 font-medium">due</span>}
        <span className="text-xs text-gray-400 hidden sm:inline">{card.cardType === 'cloze' ? 'cloze' : (card.l1 || 'es').toUpperCase()}</span>
        <span className="text-xs text-gray-400">Box {card.box || 1}</span>
        {!selectMode && (
          confirming ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red-600 font-medium hover:text-red-700 px-1.5 py-0.5 rounded bg-red-50"
              >
                {deleting ? '...' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-gray-300 hover:text-red-400 transition-colors p-0.5"
              title="Delete card"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function FlashcardPage() {
  const { l1 } = useAuth();
  const [allCards, setAllCards] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [cardSources, setCardSources] = useState([]);
  const [textBookMap, setTextBookMap] = useState({});
  const [bookTitles, setBookTitles] = useState({});
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState('all');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [showFilter, setShowFilter] = useState('all'); // 'all' | 'due' | box number
  const [selectMode, setSelectMode] = useState(false);
  const [selectedWords, setSelectedWords] = useState(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

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
          supabase.from('curated_texts').select('id, book_id, chapter_order, title').eq('status', 'published'),
          supabase.from('books').select('id, title').eq('status', 'published'),
        ]);
        setCardSources(sourcesRes.data || []);
        const tbMap = {};
        for (const t of (textsRes.data || [])) {
          if (t.book_id) tbMap[t.id] = { bookId: t.book_id, order: t.chapter_order ?? 0, title: t.title };
        }
        setTextBookMap(tbMap);
        const btMap = {};
        for (const b of (booksRes.data || [])) btMap[b.id] = b.title;
        setBookTitles(btMap);
      }
    } catch (err) { console.error('Failed to load cards:', err); }
    setLoading(false);
  }

  const folders = useMemo(() => {
    const map = {};
    const cardsByWord = {};
    for (const card of allCards) {
      cardsByWord[card.word] = card;
    }
    const dueWords = new Set(dueCards.map(c => c.word));

    const sourcedWords = new Set();
    for (const src of cardSources) {
      sourcedWords.add(src.word);
      const key = src.text_id;
      if (!map[key]) {
        map[key] = { textId: src.text_id, title: src.text_title || 'Untitled', cards: [], dueCount: 0 };
      }
      const card = cardsByWord[src.word];
      if (card) {
        map[key].cards.push(card);
        if (dueWords.has(card.word)) map[key].dueCount++;
      }
    }

    for (const card of allCards) {
      if (sourcedWords.has(card.word)) continue;
      const key = card.textId || '_unassigned';
      if (!map[key]) {
        map[key] = { textId: card.textId || null, title: card.textTitle || 'Unassigned', cards: [], dueCount: 0 };
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
        groups[bookId] = { bookId, title: bookTitles[bookId] || null, folders: [], totalCards: 0, totalDue: 0 };
      }
      groups[bookId].folders.push(folder);
      groups[bookId].totalCards += folder.cards.length;
      groups[bookId].totalDue += folder.dueCount;
    }
    return Object.values(groups);
  }, [folders, textBookMap, bookTitles]);

  const chaptersForSelectedBook = useMemo(() => {
    if (selectedBook === 'all') return [];
    const group = bookGroups.find(g => g.bookId === selectedBook);
    return group ? group.folders : [];
  }, [selectedBook, bookGroups]);

  const dueWords = useMemo(() => new Set(dueCards.map(c => c.word)), [dueCards]);

  // Cards filtered by book/chapter selection
  const bookFilteredCards = useMemo(() => {
    if (selectedBook === 'all') return allCards;
    const group = bookGroups.find(g => g.bookId === selectedBook);
    if (!group) return [];
    if (selectedChapter === 'all') return group.folders.flatMap(f => f.cards);
    const folder = group.folders.find(f => f.key === selectedChapter);
    return folder ? folder.cards : [];
  }, [selectedBook, selectedChapter, allCards, bookGroups]);

  // Further filtered by due/box filter
  const filteredCards = useMemo(() => {
    if (showFilter === 'all') return bookFilteredCards;
    if (showFilter === 'due') return bookFilteredCards.filter(c => dueWords.has(c.word));
    const box = Number(showFilter);
    if (box >= 1 && box <= 5) return bookFilteredCards.filter(c => (c.box || 1) === box);
    return bookFilteredCards;
  }, [bookFilteredCards, showFilter, dueWords]);

  const filteredDueCount = useMemo(() => {
    return bookFilteredCards.filter(c => dueWords.has(c.word)).length;
  }, [bookFilteredCards, dueWords]);

  // Word filter for LeitnerReview: scope review to current book/chapter selection
  const reviewWordFilter = useMemo(() => {
    if (selectedBook === 'all') return null;
    return new Set(bookFilteredCards.map(c => c.word));
  }, [selectedBook, bookFilteredCards]);

  // Box filter for LeitnerReview: if reviewing a specific box
  const reviewBoxFilter = useMemo(() => {
    const box = Number(showFilter);
    if (box >= 1 && box <= 5) return box;
    return null;
  }, [showFilter]);

  function handleBookChange(bookId) {
    setSelectedBook(bookId);
    setSelectedChapter('all');
    exitSelectMode();
  }

  function handleDeleteCard(word) {
    setAllCards(prev => prev.filter(c => c.word !== word));
    setDueCards(prev => prev.filter(c => c.word !== word));
    setCardSources(prev => prev.filter(s => s.word !== word));
  }

  function handleUpdateCard(word, updates) {
    setAllCards(prev => prev.map(c => c.word === word ? { ...c, ...updates } : c));
    setDueCards(prev => prev.map(c => c.word === word ? { ...c, ...updates } : c));
  }

  function toggleSelectWord(word) {
    setSelectedWords(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedWords(new Set());
  }

  function selectAll() {
    setSelectedWords(new Set(filteredCards.map(c => c.word)));
  }

  async function handleBatchDelete() {
    if (selectedWords.size === 0) return;
    setBatchDeleting(true);
    const words = [...selectedWords];
    for (const word of words) {
      try {
        await deleteSrsCard(word);
      } catch (err) {
        console.error('Failed to delete card:', word, err);
      }
    }
    setAllCards(prev => prev.filter(c => !selectedWords.has(c.word)));
    setDueCards(prev => prev.filter(c => !selectedWords.has(c.word)));
    setCardSources(prev => prev.filter(s => !selectedWords.has(s.word)));
    exitSelectMode();
    setBatchDeleting(false);
  }

  function handleReviewComplete() {
    setReviewing(false);
    loadCards();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
    );
  }

  if (reviewing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <LeitnerReview
          onComplete={handleReviewComplete}
          wordFilter={reviewWordFilter}
          boxFilter={reviewBoxFilter}
        />
      </div>
    );
  }

  if (allCards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm font-medium text-gray-600">{getUILabel('noFlashcardsYet', l1)}</p>
          <p className="text-xs mt-2 max-w-xs mx-auto">{getUILabel('noFlashcardsHint', l1)}</p>
        </div>
      </div>
    );
  }

  const booksWithCards = bookGroups.filter(g => g.bookId !== '_no_book');
  const hasBooks = booksWithCards.length > 0;
  const reviewCount = showFilter === 'due' ? filteredCards.length
    : reviewBoxFilter != null ? filteredCards.filter(c => dueWords.has(c.word)).length
    : filteredDueCount;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{getUILabel('flashcards', l1)}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} · {filteredDueCount} {getUILabel('dueForReview', l1)}
            </p>
          </div>
          <button
            onClick={() => setReviewing(true)}
            disabled={reviewCount === 0}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              reviewCount > 0
                ? 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Review ({reviewCount})
          </button>
        </div>

        <FlashcardSummaryStrip allCards={allCards} dueCards={dueCards} l1={l1} />

        {/* Book / Chapter dropdowns */}
        {hasBooks && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-gray-500 block mb-1">Book</label>
              <select
                value={selectedBook}
                onChange={e => handleBookChange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none cursor-pointer"
              >
                <option value="all">All books ({allCards.length})</option>
                {booksWithCards.map(group => (
                  <option key={group.bookId} value={group.bookId}>
                    {group.title || 'Untitled'} ({group.totalCards})
                  </option>
                ))}
                {bookGroups.some(g => g.bookId === '_no_book') && (
                  <option value="_no_book">
                    Unassigned ({bookGroups.find(g => g.bookId === '_no_book')?.totalCards || 0})
                  </option>
                )}
              </select>
            </div>
            {selectedBook !== 'all' && chaptersForSelectedBook.length > 1 && (
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-gray-500 block mb-1">Chapter</label>
                <select
                  value={selectedChapter}
                  onChange={e => setSelectedChapter(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none cursor-pointer"
                >
                  <option value="all">
                    All chapters ({bookGroups.find(g => g.bookId === selectedBook)?.totalCards || 0})
                  </option>
                  {chaptersForSelectedBook.map(folder => (
                    <option key={folder.key} value={folder.key}>
                      {folder.title} ({folder.cards.length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {!hasBooks && folders.length === 1 && folders[0].textId && (
          <p className="text-xs text-gray-400 mb-4">
            {getUILabel('from', l1)}: {folders[0].title}
          </p>
        )}

        {/* Filter bar: Due / Box / Select mode */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <FilterChip active={showFilter === 'all'} onClick={() => setShowFilter('all')}>
            All
          </FilterChip>
          <FilterChip active={showFilter === 'due'} onClick={() => setShowFilter('due')}>
            Due ({filteredDueCount})
          </FilterChip>
          {[1, 2, 3, 4, 5].map(box => {
            const count = bookFilteredCards.filter(c => (c.box || 1) === box).length;
            if (count === 0) return null;
            return (
              <FilterChip key={box} active={showFilter === String(box)} onClick={() => setShowFilter(String(box))}>
                Box {box} ({count})
              </FilterChip>
            );
          })}

          <div className="ml-auto">
            {selectMode ? (
              <button
                onClick={exitSelectMode}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setSelectMode(true)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
              >
                Select
              </button>
            )}
          </div>
        </div>

        {/* Batch actions bar */}
        {selectMode && (
          <div className="flex items-center gap-3 mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-500">{selectedWords.size} selected</span>
            <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Select all
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={selectedWords.size === 0 || batchDeleting}
              className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-40 ml-auto"
            >
              {batchDeleting ? 'Deleting...' : `Delete (${selectedWords.size})`}
            </button>
          </div>
        )}

        <BoxDistribution cards={filteredCards} />
        <CardList
          cards={filteredCards}
          dueWords={dueWords}
          l1={l1}
          onDelete={handleDeleteCard}
          onUpdate={handleUpdateCard}
          selectMode={selectMode}
          selectedWords={selectedWords}
          onToggleSelect={toggleSelectWord}
        />
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  );
}
