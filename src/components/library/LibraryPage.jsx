import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CEFR_LEVELS, CEFR_COLORS } from '../../lib/wordUtils';
import { useAuth } from '../../context/AuthContext';
import useLibraryProgress from '../../hooks/useLibraryProgress';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [texts, setTexts] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLevels, setActiveLevels] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { getBookProgress } = useLibraryProgress(user?.id);

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    try {
      const [textsRes, booksRes] = await Promise.all([
        supabase
          .from('curated_texts')
          .select('id, title, author, cefr_estimate, word_count, cover_image_url, book_id, chapter_order')
          .eq('status', 'published')
          .order('chapter_order', { ascending: true }),
        supabase
          .from('books')
          .select('*')
          .eq('status', 'published'),
      ]);
      if (textsRes.error) throw textsRes.error;
      setTexts(textsRes.data || []);
      setBooks(booksRes.data || []);
    } catch (e) {
      console.warn('Failed to load library', e);
    }
    setLoading(false);
  }

  function toggleLevel(level) {
    setActiveLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  const chaptersByBook = useMemo(() => {
    const map = {};
    for (const t of texts) {
      if (t.book_id) {
        if (!map[t.book_id]) map[t.book_id] = [];
        map[t.book_id].push(t);
      }
    }
    return map;
  }, [texts]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const items = [];

    for (const book of books) {
      const chapters = chaptersByBook[book.id] || [];
      if (activeLevels.size > 0 && !activeLevels.has(book.cefr_estimate)) continue;
      if (q && !book.title.toLowerCase().includes(q) && !(book.author || '').toLowerCase().includes(q)) continue;
      items.push({ type: 'book', book, chapterCount: chapters.length });
    }

    const bookIds = new Set(books.map(b => b.id));
    for (const t of texts) {
      if (t.book_id && bookIds.has(t.book_id)) continue;
      if (activeLevels.size > 0 && !activeLevels.has(t.cefr_estimate)) continue;
      if (q && !t.title.toLowerCase().includes(q) && !(t.author || '').toLowerCase().includes(q)) continue;
      items.push({ type: 'text', text: t });
    }

    return items;
  }, [texts, books, chaptersByBook, activeLevels, searchQuery]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Library</h1>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or author..."
            className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="flex gap-2 mb-6">
          {CEFR_LEVELS.map(level => {
            const active = activeLevels.has(level);
            const color = CEFR_COLORS[level];
            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                style={active
                  ? { backgroundColor: color, borderColor: color, color: '#fff' }
                  : { borderColor: '#d1d5db', color }
                }
              >
                {level}
              </button>
            );
          })}
          {activeLevels.size > 0 && (
            <button
              onClick={() => setActiveLevels(new Set())}
              className="px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            {texts.length === 0 && books.length === 0 ? 'No texts in the library yet.' : 'No texts match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map(item =>
              item.type === 'book' ? (
                <BookCard
                  key={`book-${item.book.id}`}
                  book={item.book}
                  chapterCount={item.chapterCount}
                  bookProgress={getBookProgress((chaptersByBook[item.book.id] || []).map(c => c.id))}
                  onClick={() => navigate(`/book/${item.book.id}`)}
                />
              ) : (
                <TextCard
                  key={`text-${item.text.id}`}
                  text={item.text}
                  onClick={() => navigate(`/read?text=${item.text.id}`)}
                />
              )
            )}
          </div>
        )}

        <a
          href="https://www.amazon.com/dp/B0H89TNQ6Z?binding=paperback&ref=dbs_dp_sirpi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-8 hover:bg-amber-100 transition-colors group"
        >
          <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-medium">¿Prefieres leer en papel?</span>{' '}
            Nuestras lecturas graduadas también están disponibles en formato impreso en Amazon.
          </p>
          <svg className="w-4 h-4 text-amber-400 group-hover:text-amber-600 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function BookCard({ book, chapterCount, bookProgress, onClick }) {
  const color = CEFR_COLORS[book.cefr_estimate] || CEFR_COLORS.unclassified;
  const initial = (book.title || '?')[0].toUpperCase();
  const hasProgress = bookProgress && bookProgress.chaptersWithActivity > 0;

  return (
    <button
      onClick={onClick}
      className="text-left border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="relative aspect-[3/4]">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}18, ${color}35)` }}
          >
            <span className="text-5xl font-bold" style={{ color }}>{initial}</span>
          </div>
        )}
        {book.cefr_estimate && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {book.cefr_estimate}
          </span>
        )}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/60">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(bookProgress.chaptersWithActivity / bookProgress.totalChapters) * 100}%` }}
            />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-gray-700">{book.title}</p>
        {book.author && (
          <p className="text-xs text-gray-500 mt-1 truncate">{book.author}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {hasProgress
            ? `${bookProgress.chaptersWithActivity}/${bookProgress.totalChapters} chapters`
            : `${chapterCount} ${chapterCount === 1 ? 'chapter' : 'chapters'}`
          }
        </p>
      </div>
    </button>
  );
}

function TextCard({ text, onClick }) {
  const color = CEFR_COLORS[text.cefr_estimate] || CEFR_COLORS.unclassified;
  const initial = (text.title || '?')[0].toUpperCase();

  return (
    <button
      onClick={onClick}
      className="text-left border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="relative aspect-[3/4]">
        {text.cover_image_url ? (
          <img
            src={text.cover_image_url}
            alt={text.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}18, ${color}35)` }}
          >
            <span className="text-5xl font-bold" style={{ color }}>{initial}</span>
          </div>
        )}
        {text.cefr_estimate && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {text.cefr_estimate}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-gray-700">{text.title}</p>
        {text.author && (
          <p className="text-xs text-gray-500 mt-1 truncate">{text.author}</p>
        )}
        {text.word_count > 0 && (
          <p className="text-xs text-gray-400 mt-1">{text.word_count} words</p>
        )}
      </div>
    </button>
  );
}
