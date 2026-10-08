import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { ScoreBar } from '../reading/PhonemeSummaryReport';
import { accuracyColor, accuracyBg, formatRelativeDate } from '../../lib/reportUtils';
import { buildWordAssessmentMap } from '../../lib/pronunciation';
import { ipaPhonemes } from '../../data/ipaPhonemes';
import { getConfusionDisplay } from '../../data/confusionPairs';
import PhonemeHistogram from './PhonemeHistogram';
import PhonemeGrowthTable from './PhonemeGrowthTable';
import LeitnerMiniBar from './LeitnerMiniBar';
import { PRONUNCIATION_DISCLAIMER } from './PronunciationDisclaimer';

const BOX_LABELS = ['Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5'];

export default function ChapterReportDetail({ detail, studentRecordings }) {
  if (!detail) return null;

  return (
    <div className="space-y-6">
      {/* Fluency + Recording row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FluencySection detail={detail} />
        <RecordingSection
          studentId={detail.studentId}
          textId={detail.textId}
          recordings={studentRecordings}
        />
      </div>

      {/* Recording history */}
      {detail.phonemes.sessions?.length > 1 && (
        <RecordingHistory sessions={detail.phonemes.sessions} />
      )}

      {/* Pronunciation assessment */}
      {detail.assessment && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-700">Pronunciation Assessment</h3>
            <PronunciationInfoIcon />
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">These scores measure connected speech across the full reading, not individual words.</p>
          <div className="space-y-2 max-w-md">
            <ScoreBar label="Accuracy" value={detail.assessment.accuracy} description="How closely each word matches expected pronunciation" />
            <ScoreBar label="Fluency" value={detail.assessment.fluency} description="Smoothness and natural pacing across the reading" />
            <ScoreBar label="Prosody" value={detail.assessment.prosody} description="Intonation, stress, and rhythm patterns" />
          </div>
          <p className="text-xs text-gray-400">
            Assessed {formatRelativeDate(detail.assessment.processedAt)}
          </p>
          <WordScoresLoader studentId={detail.studentId} textId={detail.textId} />
        </div>
      )}

      {/* Phoneme data */}
      {detail.phonemes.histogram.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PhonemeHistogram phonemes={detail.phonemes.histogram} />
          <PhonemeGrowthTable rows={detail.phonemes.growthTable} confusionTrends={detail.phonemes.confusionTrends} />
        </div>
      )}

      {/* Re-recording confusion delta */}
      {detail.phonemes.confusionTrends?.length > 0 && (
        <ReRecordingDelta confusionTrends={detail.phonemes.confusionTrends} />
      )}

      {/* Exercise results */}
      {detail.exercise && <ExerciseSection exercise={detail.exercise} />}

      {/* Flashcards */}
      {detail.flashcards.total > 0 && <FlashcardSection flashcards={detail.flashcards} />}
    </div>
  );
}

function FluencySection({ detail }) {
  const { fluency } = detail;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Reading Speed</h3>
      {fluency ? (
        <div className="space-y-3">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{fluency.wpm}</span>
              <span className="text-sm text-gray-400 ml-1">WPM</span>
            </div>
            {fluency.wordsRead && (
              <Metric label="Words" value={fluency.wordsRead} />
            )}
          </div>
          <p className="text-xs text-gray-400">
            Latest: {formatRelativeDate(fluency.date)}
          </p>
        </div>
      ) : (
        <span className="text-xs text-gray-300">No reading speed data</span>
      )}
    </div>
  );
}

function RecordingSection({ studentId, textId, recordings }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const rec = (recordings || []).find(
    r => r.user_id === studentId && r.text_id === textId
  );

  async function handlePlay() {
    if (playing) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setPlaying(false);
      return;
    }

    let url = audioUrl;
    if (!url && rec?.storage_path) {
      setLoading(true);
      const { data } = await supabase.storage
        .from('student-recordings')
        .createSignedUrl(rec.storage_path, 3600);
      setLoading(false);
      if (data?.signedUrl) {
        url = data.signedUrl;
        setAudioUrl(url);
      }
    }
    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
    setPlaying(true);
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Recording</h3>
      {rec ? (
        <div className="space-y-2">
          <button
            onClick={handlePlay}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="text-xs text-gray-400">Loading...</span>
            ) : playing ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play recording
              </>
            )}
          </button>
          {rec.duration_seconds && (
            <p className="text-xs text-gray-400">
              Duration: {Math.round(rec.duration_seconds)}s
            </p>
          )}
          {rec.assessment_status && (
            <p className="text-xs text-gray-400">
              Assessment: <span className="font-medium">{rec.assessment_status}</span>
            </p>
          )}
        </div>
      ) : (
        <span className="text-xs text-gray-300">No recording</span>
      )}
    </div>
  );
}

function WordScoresLoader({ studentId, textId }) {
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function loadWordScores() {
    if (assessmentData) { setExpanded(e => !e); return; }
    setLoading(true);
    const { data } = await supabase
      .from('pronunciation_assessments')
      .select('azure_word_scores, alignment, whisper_word_timestamps')
      .eq('user_id', studentId)
      .eq('text_id', textId)
      .order('processed_at', { ascending: false })
      .limit(1)
      .single();
    setLoading(false);
    if (data?.alignment || data?.azure_word_scores) {
      setAssessmentData(data);
      setExpanded(true);
    }
  }

  const wordEntries = useMemo(() => {
    if (!assessmentData) return [];
    const map = buildWordAssessmentMap(assessmentData);

    if (assessmentData.alignment?.length) {
      const refWords = new Map();
      for (const e of assessmentData.alignment) {
        if (e.refIdx != null && e.refWord && !refWords.has(e.refIdx)) {
          refWords.set(e.refIdx, e.refWord);
        }
      }

      const spokenIndices = assessmentData.alignment
        .filter(e => e.refIdx != null && e.spokenIdx != null)
        .map(e => e.refIdx);
      const lastSpoken = spokenIndices.length > 0 ? Math.max(...spokenIndices) : -1;
      const maxIdx = lastSpoken >= 0 ? lastSpoken : Math.max(0, ...[...refWords.keys()]);

      const entries = [];
      for (let i = 0; i <= maxIdx; i++) {
        const word = refWords.get(i);
        const assessment = map.get(i);
        if (word) {
          entries.push({
            word,
            accuracy: assessment?.accuracy ?? null,
            type: assessment?.type || 'match',
            errorType: assessment?.errorType || null,
          });
        }
      }
      return entries;
    }

    if (assessmentData.azure_word_scores?.length) {
      return assessmentData.azure_word_scores
        .filter(w => w.errorType !== 'Insertion')
        .map(w => ({
          word: w.word,
          accuracy: w.accuracyScore ?? 0,
          type: w.errorType === 'Omission' ? 'omission' : 'match',
          errorType: w.errorType || null,
        }));
    }

    return [];
  }, [assessmentData]);

  return (
    <div>
      <button
        onClick={loadWordScores}
        disabled={loading}
        className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {loading ? 'Loading...' : expanded ? 'Hide word scores' : 'Show word scores'}
      </button>
      {expanded && wordEntries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {wordEntries.map((ws, i) => {
            const accuracy = ws.accuracy ?? (ws.type === 'omission' ? 0 : 100);
            const color = accuracyColor(accuracy);
            const bg = accuracyBg(accuracy);
            return (
              <span
                key={i}
                className="text-xs font-medium px-1.5 py-0.5 rounded tabular-nums"
                style={{ color, backgroundColor: bg }}
                title={`${ws.word}: ${Math.round(accuracy)}%${ws.errorType && ws.errorType !== 'None' ? ` (${ws.errorType})` : ''}${ws.type === 'omission' ? ' (skipped)' : ''}`}
              >
                {ws.word}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExerciseSection({ exercise }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Exercises</h3>
      <div className="flex items-center gap-6">
        <div>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: accuracyColor(exercise.pct) }}
          >
            {exercise.pct}%
          </span>
          <span className="text-sm text-gray-400 ml-1">
            ({exercise.score}/{exercise.total})
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Completed {formatRelativeDate(exercise.completedAt)}
        </p>
      </div>
      {exercise.answers.length > 0 && (
        <div>
          <button
            onClick={() => setShowAnswers(s => !s)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            {showAnswers ? 'Hide answers' : 'Show per-question'}
          </button>
          {showAnswers && (
            <div className="mt-2 space-y-1">
              {exercise.answers.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                    a.correct ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {a.correct ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-600">
                    Question {(a.probeIndex ?? i) + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlashcardSection({ flashcards }) {
  const [showCards, setShowCards] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Flashcards</h3>
      <div className="flex items-center gap-4">
        <LeitnerMiniBar distribution={flashcards.distribution} width={100} height={16} />
        <span className="text-xs text-gray-500">
          {flashcards.total} card{flashcards.total !== 1 ? 's' : ''}
          {flashcards.mastered > 0 && (
            <span className="text-gray-400"> · {flashcards.mastered} mastered</span>
          )}
          {flashcards.overdue > 0 && (
            <span className="text-amber-500"> · {flashcards.overdue} overdue</span>
          )}
        </span>
      </div>
      <button
        onClick={() => setShowCards(s => !s)}
        className="text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        {showCards ? 'Hide cards' : 'Show card list'}
      </button>
      {showCards && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2.5 py-2 text-left font-medium text-gray-500">Word</th>
                <th className="px-2.5 py-2 text-center font-medium text-gray-500">Box</th>
                <th className="px-2.5 py-2 text-center font-medium text-gray-500">CEFR</th>
                <th className="px-2.5 py-2 text-right font-medium text-gray-500">Last Review</th>
              </tr>
            </thead>
            <tbody>
              {flashcards.cards
                .sort((a, b) => a.box - b.box)
                .map((c, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-2.5 py-2 font-medium text-gray-700">{c.word}</td>
                    <td className="px-2.5 py-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        c.box >= 4 ? 'bg-green-500' : c.box >= 3 ? 'bg-yellow-500' : c.box >= 2 ? 'bg-orange-500' : 'bg-red-500'
                      }`}>
                        {c.box}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-center text-gray-500">{c.cefr || '—'}</td>
                    <td className="px-2.5 py-2 text-right text-gray-400">
                      {c.lastReview ? formatRelativeDate(c.lastReview) : '—'}
                      {c.overdue && <span className="ml-1 text-amber-500 font-medium">overdue</span>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PronunciationInfoIcon() {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="About pronunciation scores"
        title="About pronunciation scores"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-20 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-xs text-gray-600 leading-relaxed">{PRONUNCIATION_DISCLAIMER}</p>
          <button
            onClick={() => setOpen(false)}
            className="mt-2 text-[11px] text-gray-400 hover:text-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </span>
  );
}

function ReRecordingDelta({ confusionTrends }) {
  const active = confusionTrends.filter(ct => !ct.resolved);
  const resolved = confusionTrends.filter(ct => ct.resolved);

  function pairLabel(ct) {
    const display = getConfusionDisplay(ct.expected, ct.alternate);
    if (display) return `${display.word1} / ${display.word2}`;
    const pd1 = ipaPhonemes[ct.expected];
    const pd2 = ipaPhonemes[ct.alternate];
    if (pd1 && pd2) return `${pd1.exampleHighlight} (${pd1.example}) → ${pd2.exampleHighlight} (${pd2.example})`;
    return `/${ct.expected}/ → /${ct.alternate}/`;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Pronunciation Progress</h3>
      <p className="text-[11px] text-gray-400">Confusion changes across re-recordings of this chapter</p>
      <div className="space-y-1">
        {active.map(ct => (
          <div key={ct.key} className="flex items-center gap-2 text-xs">
            <span className="text-orange-500 font-medium w-4">●</span>
            <span className="text-gray-700">{pairLabel(ct)}</span>
            <span className="text-gray-400 tabular-nums">
              gap {ct.first > 0 ? '+' : ''}{ct.first} → {ct.current > 0 ? '+' : ''}{ct.current}
            </span>
            <ChangeCell value={ct.change} />
          </div>
        ))}
        {resolved.map(ct => (
          <div key={ct.key} className="flex items-center gap-2 text-xs">
            <span className="text-green-500 font-medium w-4">✓</span>
            <span className="text-gray-500">{pairLabel(ct)}</span>
            <span className="text-green-600 text-[11px]">resolved</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangeCell({ value }) {
  if (value === 0) return <span className="text-gray-400 text-[11px]">no change</span>;
  const color = value < 0 ? 'text-green-600' : 'text-red-600';
  return <span className={`text-[11px] font-medium ${color}`}>({value < 0 ? '' : '+'}{value})</span>;
}

function RecordingHistory({ sessions }) {
  const first = sessions[0];
  const latest = sessions[sessions.length - 1];

  function delta(current, previous) {
    if (current == null || previous == null) return null;
    return Math.round(current - previous);
  }

  function DeltaBadge({ value, unit = '' }) {
    if (value == null || value === 0) return null;
    const positive = value > 0;
    return (
      <span className={`text-[11px] font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
        {positive ? '+' : ''}{value}{unit}
      </span>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-700">Recording History</h3>
        <span className="text-xs text-gray-400">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-2 py-1.5 text-left font-medium text-gray-500">Date</th>
              <th className="px-2 py-1.5 text-right font-medium text-gray-500">WPM</th>
              <th className="px-2 py-1.5 text-right font-medium text-gray-500">Accuracy</th>
              <th className="px-2 py-1.5 text-right font-medium text-gray-500">Fluency</th>
              <th className="px-2 py-1.5 text-right font-medium text-gray-500">Change</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => {
              const isFirst = i === 0;
              const isLatest = i === sessions.length - 1;
              const prev = isFirst ? null : sessions[i - 1];
              const accDelta = prev ? delta(s.overallAccuracy, prev.overallAccuracy) : null;
              const wpmDelta = prev ? delta(s.wpm, prev.wpm) : null;
              const fluDelta = prev ? delta(s.fluencyScore, prev.fluencyScore) : null;
              return (
                <tr
                  key={s.id || i}
                  className={`border-b border-gray-100 ${isLatest ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-2 py-1.5 text-gray-600">
                    {new Date(s.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {isFirst && <span className="ml-1 text-[10px] text-gray-400">first</span>}
                    {isLatest && <span className="ml-1 text-[10px] text-blue-500">latest</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">
                    {s.wpm != null ? s.wpm : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: accuracyColor(s.overallAccuracy) }}>
                    {s.overallAccuracy != null ? `${Math.round(s.overallAccuracy)}%` : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: accuracyColor(s.fluencyScore) }}>
                    {s.fluencyScore != null ? `${Math.round(s.fluencyScore)}%` : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {isFirst ? (
                      <span className="text-[11px] text-gray-300">baseline</span>
                    ) : (
                      <span className="flex items-center justify-end gap-1.5">
                        <DeltaBadge value={accDelta} unit="%" />
                        <DeltaBadge value={wpmDelta} />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* First-to-latest summary */}
      {sessions.length >= 2 && (
        <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
          <span>Overall change:</span>
          {delta(latest.overallAccuracy, first.overallAccuracy) != null && (
            <span>Accuracy <DeltaBadge value={delta(latest.overallAccuracy, first.overallAccuracy)} unit="%" /></span>
          )}
          {delta(latest.wpm, first.wpm) != null && (
            <span>WPM <DeltaBadge value={delta(latest.wpm, first.wpm)} /></span>
          )}
          {delta(latest.fluencyScore, first.fluencyScore) != null && (
            <span>Fluency <DeltaBadge value={delta(latest.fluencyScore, first.fluencyScore)} unit="%" /></span>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-400 block">{label}</span>
      <span className="text-sm font-medium text-gray-700 tabular-nums">{value}</span>
    </div>
  );
}
