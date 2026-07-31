import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CEFR_COLORS } from '../../lib/wordUtils';
import { useAuth } from '../../context/AuthContext';
import useChapterProgress from '../../hooks/useChapterProgress';
import ChapterProgressPanel from './ChapterProgressPanel';
import { getUILabel } from '../../lib/locales';

export default function BookChaptersPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user, l1 } = useAuth();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState(null);

  const chapterIds = chapters.map(ch => ch.id);
  const { progress, reload: reloadProgress } = useChapterProgress({
    chapterIds,
    userId: user?.id,
  });

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
          <p className="text-gray-400">{getUILabel('bookNotFound', l1)}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-sm text-blue-600 hover:text-blue-800">
            {getUILabel('backToLibrary', l1)}
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
          <span>&larr;</span> {getUILabel('navLibrary', l1)}
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
                {chapters.length} {getUILabel('chapters', l1)}
              </span>
              {totalWords > 0 && (
                <span className="text-xs text-gray-400">{totalWords.toLocaleString()} {getUILabel('wordsCount', l1)}</span>
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
            const cp = progress[ch.id];
            const hasActivity = cp && (
              cp.fluency.sessionCount > 0 || cp.recording.exists ||
              cp.srs.totalCards > 0 || (cp.assignments && cp.assignments.total > 0)
            );
            const isExpanded = expandedChapter === ch.id;

            return (
              <div key={ch.id}>
                <button
                  onClick={() => navigate(`/read?text=${ch.id}`)}
                  className={`w-full text-left flex items-center gap-4 px-4 py-3 border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all group ${
                    isExpanded ? 'rounded-t-lg' : 'rounded-lg'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-400 w-8 text-right">
                    {ch.chapter_order ?? i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 truncate">
                      {ch.title}
                    </p>
                    {hasActivity && (
                      <div className="flex items-center gap-2.5 mt-0.5">
                        {cp.fluency.sessionCount > 0 && (
                          <span className="text-[10px] text-amber-600 font-medium">
                            {cp.fluency.latestWpm} WPM
                          </span>
                        )}
                        {cp.recording.exists && (
                          <span className="text-[10px] text-gray-400" title="Recording saved">🎤</span>
                        )}
                        {cp.recording.assessmentStatus === 'complete' && (
                          <span className="text-[10px] text-green-500 flex items-center gap-0.5" title="Pronunciation feedback available">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.844-8.791a.75.75 0 00-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.15-.043l4.25-5.5z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {cp.srs.totalCards > 0 && (
                          <span className="text-[10px] text-gray-500">
                            {cp.srs.totalCards} {getUILabel('cards', l1)}
                            {cp.srs.dueCards > 0 && (
                              <span className="text-amber-600 ml-0.5">({cp.srs.dueCards} {getUILabel('due', l1)})</span>
                            )}
                          </span>
                        )}
                        {cp.assignments && cp.assignments.total > 0 && (
                          <span className={`text-[10px] font-medium ${
                            cp.assignments.completed === cp.assignments.total ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {cp.assignments.completed}/{cp.assignments.total} {getUILabel('tasks', l1)}
                          </span>
                        )}
                      </div>
                    )}
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
                    <span className="text-xs text-gray-400 hidden sm:inline">{ch.word_count} {getUILabel('wordsCount', l1)}</span>
                  )}
                  {hasActivity && (
                    <span
                      role="button"
                      tabIndex={0}
                      title="View progress"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setExpandedChapter(isExpanded ? null : ch.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          e.preventDefault();
                          setExpandedChapter(isExpanded ? null : ch.id);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 1.5 1.5h.5a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16 2h-.5ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9A1.5 1.5 0 0 0 9.5 18h.5a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 10 6h-.5ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5A1.5 1.5 0 0 0 3.5 18h.5A1.5 1.5 0 0 0 5.5 16.5v-5A1.5 1.5 0 0 0 4 10h-.5Z" />
                      </svg>
                    </span>
                  )}
                  <span className="text-gray-300 group-hover:text-gray-500 flex-shrink-0">&rsaquo;</span>
                </button>
                {isExpanded && cp && (
                  <ChapterProgressPanel chapterProgress={cp} textId={ch.id} userId={user?.id} l1={l1} onReset={reloadProgress} />
                )}
              </div>
            );
          })}
        </div>

        {chapters.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            {getUILabel('noChaptersYet', l1)}
          </div>
        )}
      </div>
    </div>
  );
}
