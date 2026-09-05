import { useMemo, useCallback } from 'react';

const WEAK_PHONEME_THRESHOLD = 50;
const WEAK_PHONEME_MIN_SESSIONS = 3;
const GROWTH_MIN_SESSIONS = 5;

export default function useReportData({
  students,
  assignments,
  allTexts,
  books,
  fluencySessions,
  pronunciationAssessments,
  phonemeSessions,
  srsCards,
  exerciseResults,
  progress,
  bookFilter,
  dateRange,
}) {
  const textBookMap = useMemo(() => {
    const map = {};
    for (const t of allTexts) {
      if (t.book_id) map[t.id] = t.book_id;
    }
    return map;
  }, [allTexts]);

  const bookChapters = useMemo(() => {
    const map = {};
    for (const t of allTexts) {
      if (t.book_id) {
        if (!map[t.book_id]) map[t.book_id] = [];
        map[t.book_id].push(t);
      }
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => (a.chapter_order ?? 0) - (b.chapter_order ?? 0));
    }
    return map;
  }, [allTexts]);

  const bookMap = useMemo(() => {
    const map = {};
    for (const b of books) map[b.id] = b;
    return map;
  }, [books]);

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;
    if (bookFilter) {
      const chapterIds = new Set((bookChapters[bookFilter] || []).map(t => t.id));
      filtered = filtered.filter(a => chapterIds.has(a.textId));
    }
    if (dateRange?.start) {
      filtered = filtered.filter(a => {
        const d = a.dueDate || a.createdAt;
        return d && d >= dateRange.start;
      });
    }
    if (dateRange?.end) {
      filtered = filtered.filter(a => {
        const d = a.dueDate || a.createdAt;
        return d && d <= dateRange.end;
      });
    }
    return filtered;
  }, [assignments, bookFilter, bookChapters, dateRange]);

  const assignedTextIds = useMemo(() => {
    return new Set(filteredAssignments.map(a => a.textId));
  }, [filteredAssignments]);

  const assignmentDateByText = useMemo(() => {
    const map = {};
    for (const a of filteredAssignments) {
      if (!map[a.textId] || a.createdAt < map[a.textId]) {
        map[a.textId] = a.createdAt;
      }
    }
    return map;
  }, [filteredAssignments]);

  const rosterRows = useMemo(() => {
    return students.map(student => {
      const sid = student.id;

      const studentFluency = fluencySessions.filter(
        f => f.user_id === sid && assignedTextIds.has(f.text_id)
      );
      const latestWpmByText = mostRecentByTextId(studentFluency, 'session_date');
      const wpmValues = sortByChapterOrder(latestWpmByText, allTexts).map(f => f.wpm);
      const wpmDelta = wpmValues.length >= 2 ? wpmValues[wpmValues.length - 1] - wpmValues[0] : 0;
      const avgWpm = wpmValues.length > 0 ? Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length) : null;

      const studentAssessments = pronunciationAssessments.filter(
        a => a.user_id === sid && assignedTextIds.has(a.text_id)
      );
      const latestAccByText = mostRecentByTextId(studentAssessments, 'processed_at');
      const accuracyValues = sortByChapterOrder(latestAccByText, allTexts).map(a => Math.round(a.overall_accuracy));
      const avgAccuracy = accuracyValues.length > 0 ? Math.round(accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length) : null;

      const studentPhonemes = phonemeSessions.filter(
        ps => ps.user_id === sid && assignedTextIds.has(ps.text_id)
      );
      const weakPhonemes = computeWeakPhonemes(studentPhonemes);

      const studentCards = (srsCards || []).filter(c => c.user_id === sid);
      const totalCards = studentCards.length;
      const masteredCards = studentCards.filter(c => (c.leitner_box || 1) >= 4).length;
      const validatedCards = studentCards.filter(c => {
        if (!c.text_id || !assignedTextIds.has(c.text_id)) return false;
        const assignDate = assignmentDateByText[c.text_id];
        if (!assignDate || !c.added_date) return true;
        return c.added_date >= assignDate;
      }).length;
      const now = new Date();
      const overdueCards = studentCards.filter(c => c.next_review_date && new Date(c.next_review_date) <= now).length;
      const lastReviewDate = studentCards.reduce((latest, c) => {
        if (!c.last_review_date) return latest;
        return !latest || c.last_review_date > latest ? c.last_review_date : latest;
      }, null);
      const leitnerDistribution = [0, 0, 0, 0, 0];
      for (const c of studentCards) {
        const box = (c.leitner_box || 1) - 1;
        if (box >= 0 && box < 5) leitnerDistribution[box]++;
      }

      const studentExercises = (exerciseResults || []).filter(
        er => er.user_id === sid && assignedTextIds.has(er.text_id)
      );
      const exerciseValues = sortByChapterOrder(studentExercises, allTexts).map(
        er => er.total > 0 ? Math.round((er.score / er.total) * 100) : 0
      );
      const exerciseAvg = exerciseValues.length > 0 ? Math.round(exerciseValues.reduce((a, b) => a + b, 0) / exerciseValues.length) : null;

      const totalAssignments = filteredAssignments.length;
      const completedAssignments = filteredAssignments.filter(a => {
        const p = (progress || []).find(pr => pr.assignmentId === a.id && pr.studentId === sid);
        if (!p?.completed) return false;
        const taskKeys = Object.keys(a.tasks || {}).filter(k => a.tasks[k]);
        return taskKeys.every(k => p.completed[k]);
      }).length;

      const totalBooks = Object.keys(bookChapters).length;
      const completedBooks = Object.keys(bookChapters).filter(bookId => {
        const chapters = bookChapters[bookId];
        return chapters.every(ch => {
          const hasSession = studentFluency.some(f => f.text_id === ch.id) ||
            studentAssessments.some(a => a.text_id === ch.id) ||
            studentExercises.some(er => er.text_id === ch.id);
          return hasSession;
        });
      }).length;

      return {
        studentId: sid,
        studentName: student.name,
        booksCompleted: `${completedBooks}/${totalBooks}`,
        assignmentsDone: `${completedAssignments}/${totalAssignments}`,
        avgWpm,
        wpmValues,
        wpmDelta,
        avgAccuracy,
        accuracyValues,
        weakPhonemes,
        totalCards,
        validatedCards,
        masteredCards,
        overdueCards,
        lastReviewDate,
        leitnerDistribution,
        exerciseAvg,
        exerciseValues,
      };
    });
  }, [students, filteredAssignments, assignedTextIds, assignmentDateByText, fluencySessions, pronunciationAssessments, phonemeSessions, srsCards, exerciseResults, progress, allTexts, bookChapters]);

  const getStudentReport = useCallback((studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const sid = studentId;
    const studentCards = (srsCards || []).filter(c => c.user_id === sid);
    const now = new Date();

    const totalCards = studentCards.length;
    const masteredCards = studentCards.filter(c => (c.leitner_box || 1) >= 4).length;
    const overdueCards = studentCards.filter(c => c.next_review_date && new Date(c.next_review_date) <= now).length;
    const lastReviewDate = studentCards.reduce((latest, c) => {
      if (!c.last_review_date) return latest;
      return !latest || c.last_review_date > latest ? c.last_review_date : latest;
    }, null);
    const globalLeitner = [0, 0, 0, 0, 0];
    for (const c of studentCards) {
      const box = (c.leitner_box || 1) - 1;
      if (box >= 0 && box < 5) globalLeitner[box]++;
    }

    const allStudentPhonemes = phonemeSessions.filter(
      ps => ps.user_id === sid && assignedTextIds.has(ps.text_id)
    );
    const globalWeak = computeWeakPhonemes(allStudentPhonemes);

    const totalBooks = Object.keys(bookChapters).length;
    const completedBookCount = Object.keys(bookChapters).filter(bookId => {
      const chapters = bookChapters[bookId];
      return chapters.every(ch => {
        const fl = fluencySessions.some(f => f.user_id === sid && f.text_id === ch.id && assignedTextIds.has(ch.id));
        const pa = pronunciationAssessments.some(a => a.user_id === sid && a.text_id === ch.id && assignedTextIds.has(ch.id));
        const ex = (exerciseResults || []).some(er => er.user_id === sid && er.text_id === ch.id && assignedTextIds.has(ch.id));
        return fl || pa || ex;
      });
    }).length;

    const bookReports = Object.keys(bookChapters)
      .filter(bookId => bookMap[bookId])
      .map(bookId => {
        const chapters = bookChapters[bookId];
        const chapterTextIds = new Set(chapters.map(ch => ch.id));
        const assignedChapterIds = chapters.filter(ch => assignedTextIds.has(ch.id));

        const chapterFluency = fluencySessions.filter(
          f => f.user_id === sid && chapterTextIds.has(f.text_id) && assignedTextIds.has(f.text_id)
        );
        const latestWpm = mostRecentByTextId(chapterFluency, 'session_date');
        const wpmSorted = sortByChapterOrder(latestWpm, allTexts);
        const wpmValues = wpmSorted.map(f => f.wpm);
        const wpmLabels = wpmSorted.map(f => chapterLabel(f.text_id, chapters));

        const chapterAssessments = pronunciationAssessments.filter(
          a => a.user_id === sid && chapterTextIds.has(a.text_id) && assignedTextIds.has(a.text_id)
        );
        const latestAcc = mostRecentByTextId(chapterAssessments, 'processed_at');
        const accSorted = sortByChapterOrder(latestAcc, allTexts);
        const accValues = accSorted.map(a => Math.round(a.overall_accuracy));
        const accLabels = accSorted.map(a => chapterLabel(a.text_id, chapters));

        const fluencyValues = accSorted.map(a => a.azure_fluency_score != null ? Math.round(a.azure_fluency_score) : null).filter(v => v != null);
        const fluencyLabels = accSorted.filter(a => a.azure_fluency_score != null).map(a => chapterLabel(a.text_id, chapters));

        const chapterPhonemes = allStudentPhonemes.filter(ps => chapterTextIds.has(ps.text_id));
        const phonemeHistogram = computePhonemeHistogram(chapterPhonemes);
        const phonemeGrowth = computePhonemeGrowth(chapterPhonemes);
        const confusionTrends = computeConfusionTrends(chapterPhonemes);

        const chapterExercises = (exerciseResults || []).filter(
          er => er.user_id === sid && chapterTextIds.has(er.text_id) && assignedTextIds.has(er.text_id)
        );
        const exSorted = sortByChapterOrder(chapterExercises, allTexts);
        const exValues = exSorted.map(er => er.total > 0 ? Math.round((er.score / er.total) * 100) : 0);
        const exLabels = exSorted.map(er => chapterLabel(er.text_id, chapters));
        const exAvg = exValues.length > 0 ? Math.round(exValues.reduce((a, b) => a + b, 0) / exValues.length) : 0;

        const bookCards = studentCards.filter(c => chapterTextIds.has(c.text_id));
        const bookLeitner = [0, 0, 0, 0, 0];
        for (const c of bookCards) {
          const box = (c.leitner_box || 1) - 1;
          if (box >= 0 && box < 5) bookLeitner[box]++;
        }

        return {
          bookId,
          bookTitle: bookMap[bookId]?.title || bookId,
          chapters: assignedChapterIds.map(ch => ({
            textId: ch.id,
            label: ch.title || `Ch ${(ch.chapter_order ?? 0) + 1}`,
            chapterOrder: ch.chapter_order ?? 0,
          })),
          wpm: {
            values: wpmValues,
            labels: wpmLabels,
            delta: wpmValues.length >= 2 ? wpmValues[wpmValues.length - 1] - wpmValues[0] : null,
          },
          accuracy: {
            values: accValues,
            labels: accLabels,
            delta: accValues.length >= 2 ? accValues[accValues.length - 1] - accValues[0] : null,
          },
          fluency: {
            values: fluencyValues,
            labels: fluencyLabels,
            delta: fluencyValues.length >= 2 ? fluencyValues[fluencyValues.length - 1] - fluencyValues[0] : null,
          },
          phonemes: {
            histogram: phonemeHistogram,
            growthTable: phonemeGrowth,
            confusionTrends,
          },
          exercises: {
            values: exValues,
            labels: exLabels,
            bookAvg: exAvg,
          },
          flashcards: {
            total: bookCards.length,
            mastered: bookCards.filter(c => (c.leitner_box || 1) >= 4).length,
            overdue: bookCards.filter(c => c.next_review_date && new Date(c.next_review_date) <= now).length,
            distribution: bookLeitner,
            cards: bookCards.map(c => ({
              word: c.word,
              box: c.leitner_box || 1,
              cefr: c.cefr,
              lastReview: c.last_review_date,
              overdue: c.next_review_date && new Date(c.next_review_date) <= now,
            })),
          },
        };
      });

    return {
      studentId: sid,
      studentName: student.name,
      global: {
        booksCompleted: `${completedBookCount}/${totalBooks}`,
        totalCards,
        masteredCards,
        overdueCards,
        lastReviewDate,
        leitnerDistribution: globalLeitner,
        weakPhonemes: globalWeak,
      },
      books: bookReports,
    };
  }, [students, srsCards, phonemeSessions, fluencySessions, pronunciationAssessments, exerciseResults, assignedTextIds, bookChapters, bookMap, allTexts]);

  const getChapterDetail = useCallback((studentId, textId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const text = allTexts.find(t => t.id === textId);
    if (!text) return null;

    const sid = studentId;

    const chapterFluency = fluencySessions
      .filter(f => f.user_id === sid && f.text_id === textId)
      .sort((a, b) => (a.session_date || '').localeCompare(b.session_date || ''));
    const latestFluency = chapterFluency.length > 0 ? chapterFluency[chapterFluency.length - 1] : null;

    const chapterAssessment = pronunciationAssessments
      .filter(a => a.user_id === sid && a.text_id === textId)
      .sort((a, b) => (a.processed_at || '').localeCompare(b.processed_at || ''));
    const latestAssessment = chapterAssessment.length > 0 ? chapterAssessment[chapterAssessment.length - 1] : null;

    const chapterPhonemes = phonemeSessions.filter(
      ps => ps.user_id === sid && ps.text_id === textId
    );
    const phonemeHistogram = computePhonemeHistogram(chapterPhonemes);
    const phonemeGrowth = computePhonemeGrowth(chapterPhonemes);
    const confusionTrends = computeConfusionTrends(chapterPhonemes);

    const chapterExercises = (exerciseResults || []).filter(
      er => er.user_id === sid && er.text_id === textId
    );
    const latestExercise = chapterExercises.length > 0
      ? chapterExercises.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))[0]
      : null;

    const chapterCards = (srsCards || []).filter(
      c => c.user_id === sid && c.text_id === textId
    );
    const leitnerDist = [0, 0, 0, 0, 0];
    for (const c of chapterCards) {
      const box = (c.leitner_box || 1) - 1;
      if (box >= 0 && box < 5) leitnerDist[box]++;
    }
    const now = new Date();

    return {
      studentId: sid,
      studentName: student.name,
      textId,
      chapterTitle: text.title || `Chapter ${(text.chapter_order ?? 0) + 1}`,
      bookId: text.book_id,
      fluency: latestFluency ? {
        wpm: latestFluency.wpm,
        date: latestFluency.session_date,
        duration: latestFluency.duration_seconds,
        wordsRead: latestFluency.words_read,
        mode: latestFluency.session_mode,
      } : null,
      fluencyHistory: chapterFluency.map(f => ({
        wpm: f.wpm,
        date: f.session_date,
        duration: f.duration_seconds,
      })),
      assessment: latestAssessment ? {
        accuracy: latestAssessment.overall_accuracy,
        fluency: latestAssessment.azure_fluency_score,
        prosody: latestAssessment.azure_prosody_score,
        completeness: latestAssessment.azure_completeness_score,
        processedAt: latestAssessment.processed_at,
      } : null,
      phonemes: {
        histogram: phonemeHistogram,
        growthTable: phonemeGrowth,
        confusionTrends,
      },
      exercise: latestExercise ? {
        score: latestExercise.score,
        total: latestExercise.total,
        pct: latestExercise.total > 0 ? Math.round((latestExercise.score / latestExercise.total) * 100) : 0,
        completedAt: latestExercise.completed_at,
        answers: latestExercise.answers || [],
      } : null,
      flashcards: {
        cards: chapterCards.map(c => ({
          word: c.word,
          box: c.leitner_box || 1,
          cefr: c.cefr,
          lastReview: c.last_review_date,
          overdue: c.next_review_date && new Date(c.next_review_date) <= now,
        })),
        total: chapterCards.length,
        mastered: chapterCards.filter(c => (c.leitner_box || 1) >= 4).length,
        overdue: chapterCards.filter(c => c.next_review_date && new Date(c.next_review_date) <= now).length,
        distribution: leitnerDist,
      },
    };
  }, [students, allTexts, fluencySessions, pronunciationAssessments, phonemeSessions, exerciseResults, srsCards]);

  return { rosterRows, getStudentReport, getChapterDetail };
}

function mostRecentByTextId(sessions, dateField) {
  const map = {};
  for (const s of sessions) {
    const existing = map[s.text_id];
    if (!existing || (s[dateField] && (!existing[dateField] || s[dateField] > existing[dateField]))) {
      map[s.text_id] = s;
    }
  }
  return Object.values(map);
}

function sortByChapterOrder(items, allTexts) {
  const orderMap = {};
  for (const t of allTexts) {
    orderMap[t.id] = t.chapter_order ?? 9999;
  }
  return [...items].sort((a, b) => {
    const textIdA = a.text_id;
    const textIdB = b.text_id;
    return (orderMap[textIdA] ?? 9999) - (orderMap[textIdB] ?? 9999);
  });
}

function chapterLabel(textId, chapters) {
  const ch = chapters.find(c => c.id === textId);
  if (!ch) return textId;
  return `${(ch.chapter_order ?? 0) + 1}`;
}

function computePhonemeHistogram(phonemeSessions) {
  const data = {};
  for (const ps of phonemeSessions) {
    const medians = ps.phoneme_medians || {};
    for (const [phoneme, median] of Object.entries(medians)) {
      if (!data[phoneme]) data[phoneme] = [];
      data[phoneme].push(median);
    }
  }
  return Object.entries(data).map(([phoneme, scores]) => ({
    phoneme,
    median: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));
}

function computePhonemeGrowth(phonemeSessions) {
  const data = {};
  for (const ps of phonemeSessions) {
    const medians = ps.phoneme_medians || {};
    const date = ps.session_date;
    for (const [phoneme, median] of Object.entries(medians)) {
      if (!data[phoneme]) data[phoneme] = [];
      data[phoneme].push({ median, date });
    }
  }
  return Object.entries(data).map(([phoneme, entries]) => {
    const sorted = entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const first = Math.round(sorted[0].median);
    const current = Math.round(sorted[sorted.length - 1].median);
    return {
      phoneme,
      current,
      first,
      change: current - first,
      sessions: sorted.length,
      values: sorted.map(e => Math.round(e.median)),
    };
  });
}

function computeConfusionTrends(phonemeSessions) {
  const pairHistory = {};
  for (const ps of phonemeSessions) {
    const confusions = ps.phoneme_confusions;
    if (!confusions) continue;
    const date = ps.session_date;
    for (const [key, data] of Object.entries(confusions)) {
      if (!pairHistory[key]) pairHistory[key] = { expected: data.expected, alternate: data.alternate, entries: [] };
      pairHistory[key].entries.push({ gap: data.gap, date });
    }
  }
  return Object.entries(pairHistory)
    .filter(([, data]) => data.entries.length >= 2)
    .map(([key, data]) => {
      const sorted = data.entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const first = sorted[0].gap;
      const current = sorted[sorted.length - 1].gap;
      return {
        key,
        expected: data.expected,
        alternate: data.alternate,
        current,
        first,
        change: current - first,
        sessions: sorted.length,
        values: sorted.map(e => e.gap),
        resolved: current < 0,
      };
    })
    .sort((a, b) => b.current - a.current);
}

function computeWeakPhonemes(phonemeSessions) {
  const phonemeData = {};
  for (const ps of phonemeSessions) {
    const medians = ps.phoneme_medians || {};
    for (const [phoneme, median] of Object.entries(medians)) {
      if (!phonemeData[phoneme]) phonemeData[phoneme] = [];
      phonemeData[phoneme].push(median);
    }
  }

  const weak = [];
  for (const [phoneme, scores] of Object.entries(phonemeData)) {
    if (scores.length < WEAK_PHONEME_MIN_SESSIONS) continue;
    const median = scores[Math.floor(scores.length / 2)];
    if (median < WEAK_PHONEME_THRESHOLD) {
      weak.push({ phoneme, median: Math.round(median), sessions: scores.length });
    }
  }
  return weak.sort((a, b) => a.median - b.median);
}
