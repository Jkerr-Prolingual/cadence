import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useChapterProgress({ chapterIds, userId }) {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const [fluencyRes, recordingRes, srsSourcesRes, enrollRes] = await Promise.all([
        supabase
          .from('fluency_sessions')
          .select('text_id, wpm, pass_number, session_date')
          .eq('user_id', userId)
          .in('text_id', chapterIds)
          .order('session_date', { ascending: true }),
        supabase
          .from('student_recordings')
          .select('text_id, storage_path, duration_seconds')
          .eq('user_id', userId)
          .in('text_id', chapterIds),
        supabase
          .from('srs_card_sources')
          .select('text_id, word')
          .eq('user_id', userId)
          .in('text_id', chapterIds),
        supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', userId),
      ]);

      // Fetch card details for words found in sources
      const sourceWords = [...new Set((srsSourcesRes.data || []).map(s => s.word))];
      let srsCards = [];
      if (sourceWords.length > 0) {
        const { data } = await supabase
          .from('srs_cards')
          .select('word, leitner_box, next_review_date')
          .eq('user_id', userId)
          .in('word', sourceWords);
        srsCards = data || [];
      }
      const cardMap = {};
      for (const c of srsCards) cardMap[c.word] = c;

      const result = {};
      for (const id of chapterIds) {
        result[id] = {
          fluency: { sessionCount: 0, latestWpm: null, wpmHistory: [] },
          recording: { exists: false, storagePath: null, durationSeconds: null },
          srs: { totalCards: 0, dueCards: 0 },
          assignments: null,
        };
      }

      // Fluency sessions
      for (const s of fluencyRes.data || []) {
        const entry = result[s.text_id];
        if (!entry) continue;
        entry.fluency.wpmHistory.push(s.wpm);
        entry.fluency.sessionCount++;
        entry.fluency.latestWpm = s.wpm;
      }

      // Recordings
      for (const r of recordingRes.data || []) {
        const entry = result[r.text_id];
        if (!entry) continue;
        entry.recording = {
          exists: true,
          storagePath: r.storage_path,
          durationSeconds: r.duration_seconds,
        };
      }

      // SRS cards (via sources join table)
      const now = new Date().toISOString();
      for (const src of srsSourcesRes.data || []) {
        const entry = result[src.text_id];
        if (!entry) continue;
        const card = cardMap[src.word];
        if (!card) continue;
        entry.srs.totalCards++;
        if (card.next_review_date && card.next_review_date <= now) {
          entry.srs.dueCards++;
        }
      }

      // Assignments (only if enrolled in a class)
      const classIds = (enrollRes.data || []).map(e => e.class_id);
      if (classIds.length > 0) {
        const [assignRes, progRes] = await Promise.all([
          supabase
            .from('assignments')
            .select('*')
            .in('class_id', classIds)
            .in('text_id', chapterIds)
            .is('archived_at', null),
          supabase
            .from('assignment_progress')
            .select('*')
            .eq('student_id', userId),
        ]);

        const assignments = assignRes.data || [];
        const progressRows = progRes.data || [];

        for (const a of assignments) {
          const entry = result[a.text_id];
          if (!entry) continue;
          const taskList = Object.entries(a.tasks || {}).filter(([, v]) => v);
          const prog = progressRows.find(p => p.assignment_id === a.id);
          const completedCount = taskList.filter(([key]) => prog?.completed?.[key]).length;

          if (!entry.assignments) {
            entry.assignments = { total: 0, completed: 0 };
          }
          entry.assignments.total += taskList.length;
          entry.assignments.completed += completedCount;
        }
      }

      setProgress(result);
    } catch (err) {
      console.warn('Failed to load chapter progress', err);
    }
    setLoading(false);
  };

  const chapterKey = chapterIds?.join(',');
  useEffect(() => {
    if (!userId || !chapterIds?.length) {
      setProgress({});
      setLoading(false);
      return;
    }
    loadProgress();
  }, [userId, chapterKey]);

  return { progress, loading, reload: loadProgress };
}
