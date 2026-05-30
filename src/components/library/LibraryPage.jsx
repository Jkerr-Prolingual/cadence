import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CEFR_LEVELS, CEFR_COLORS } from '../../lib/wordUtils';

export default function LibraryPage() {
  const navigate = useNavigate();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLevels, setActiveLevels] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTexts();
  }, []);

  async function loadTexts() {
    try {
      const { data, error } = await supabase
        .from('curated_texts')
        .select('id, title, author, cefr_estimate, word_count, cover_image_url, series_id')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (error) throw error;
      setTexts(data || []);
    } catch (e) {
      console.warn('Failed to load library texts', e);
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

  const filteredTexts = useMemo(() => {
    return texts.filter(t => {
      if (activeLevels.size > 0 && !activeLevels.has(t.cefr_estimate)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.author || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [texts, activeLevels, searchQuery]);

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
        ) : filteredTexts.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            {texts.length === 0 ? 'No texts in the library yet.' : 'No texts match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTexts.map(text => (
              <TextCard key={text.id} text={text} onClick={() => navigate(`/?text=${text.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
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
