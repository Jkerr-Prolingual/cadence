import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function useLibraryProgress(userId) {
  const [activeTextIds, setActiveTextIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setActiveTextIds(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      supabase.from('fluency_sessions').select('text_id').eq('user_id', userId),
      supabase.from('student_recordings').select('text_id').eq('user_id', userId),
      supabase.from('srs_cards').select('text_id').eq('user_id', userId),
    ]).then(([fluencyRes, recordingRes, srsRes]) => {
      if (cancelled) return;
      const ids = new Set();
      for (const r of fluencyRes.data || []) if (r.text_id) ids.add(r.text_id);
      for (const r of recordingRes.data || []) if (r.text_id) ids.add(r.text_id);
      for (const r of srsRes.data || []) if (r.text_id) ids.add(r.text_id);
      setActiveTextIds(ids);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [userId]);

  const getBookProgress = useCallback((bookChapterIds) => {
    if (!bookChapterIds?.length) return { chaptersWithActivity: 0, totalChapters: 0 };
    const active = bookChapterIds.filter(id => activeTextIds.has(id));
    return {
      chaptersWithActivity: active.length,
      totalChapters: bookChapterIds.length,
    };
  }, [activeTextIds]);

  return { getBookProgress, loading };
}
