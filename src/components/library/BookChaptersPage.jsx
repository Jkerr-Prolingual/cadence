import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CEFR_COLORS } from '../../lib/wordUtils';

export default function BookChaptersPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  async function loadBook() {
    try {
      const [bookRes, chaptersRes] = await Promise.all([
        supabase.from('books').select('*').eq('id', bookId).single(),
        supabase
          .from('curated_texts')
          .select('id, title, cefr_estimate, word_count, chapter_order')
          .eq('book_id', bookId)
          .eq('status', 'published')
          .order('chapter_order', { ascending: true }),
      ]);
      if (bookRes.error) throw bookRes.error;
      setBook(bookRes.data);
      setChapters(chaptersRes.data || []);
    } catch (e) {
      console.warn('Failed to load book', e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400">Book not found.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-sm text-blue-600 hover:text-blue-800">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const color = CEFR_COLORS[book.cefr_estimate] || CEFR_COLORS.unclassified;
  const initial = (book.title || '?')[0].toUpperCase();
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
        >
          <span>&larr;</span> Library
        </button>

        <div className="flex gap-6 mb-8">
          <div className="w-36 flex-shrink-0">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200">
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${color}18, ${color}35)` }}
                >
                  <span className="text-5xl font-bold" style={{ color }}>{initial}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">{book.title}</h1>
            {book.author && <p className="text-sm text-gray-500 mt-1">{book.author}</p>}

            <div className="flex items-center gap-3 mt-3">
              {book.cefr_estimate && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: color }}
                >
                  {book.cefr_estimate}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
              </span>
              {totalWords > 0 && (
                <span className="text-xs text-gray-400">{totalWords.toLocaleString()} words</span>
              )}
            </div>

            {book.description && (
              <p className="text-sm text-gray-600 mt-4 leading-relaxed">{book.description}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {chapters.map((ch, i) => {
            const chColor = CEFR_COLORS[ch.cefr_estimate] || '#6b7280';
            return (
              <button
                key={ch.id}
                onClick={() => navigate(`/read?text=${ch.id}`)}
                className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all group"
              >
                <span className="text-sm font-medium text-gray-400 w-8 text-right">
                  {ch.chapter_order ?? i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 truncate">
                    {ch.title}
                  </p>
                </div>
                {ch.cefr_estimate && (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: chColor + '20', color: chColor }}
                  >
                    {ch.cefr_estimate}
                  </span>
                )}
                {ch.word_count > 0 && (
                  <span className="text-xs text-gray-400">{ch.word_count} words</span>
                )}
                <span className="text-gray-300 group-hover:text-gray-500">&rsaquo;</span>
              </button>
            );
          })}
        </div>

        {chapters.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            No chapters published yet.
          </div>
        )}
      </div>
    </div>
  );
}
