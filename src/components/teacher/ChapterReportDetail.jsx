import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ScoreBar } from '../reading/PhonemeSummaryReport';
import { accuracyColor, accuracyBg, formatRelativeDate } from '../../lib/reportUtils';
import PhonemeHistogram from './PhonemeHistogram';
import PhonemeGrowthTable from './PhonemeGrowthTable';
import LeitnerMiniBar from './LeitnerMiniBar';
import Sparkline from './Sparkline';

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

      {/* Pronunciation assessment */}
      {detail.assessment && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Pronunciation Assessment</h3>
          <div className="space-y-2 max-w-md">
            <ScoreBar label="Accuracy" value={detail.assessment.accuracy} />
            <ScoreBar label="Fluency" value={detail.assessment.fluency} />
            <ScoreBar label="Prosody" value={detail.assessment.prosody} />
            <ScoreBar label="Complete" value={detail.assessment.completeness} />
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
          <PhonemeGrowthTable rows={detail.phonemes.growthTable} />
        </div>
      )}

      {/* Exercise results */}
      {detail.exercise && <ExerciseSection exercise={detail.exercise} />}

      {/* Flashcards */}
      {detail.flashcards.total > 0 && <FlashcardSection flashcards={detail.flashcards} />}
    </div>
  );
}

function FluencySection({ detail }) {
  const { fluency, fluencyHistory } = detail;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Timed Read</h3>
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
            {fluency.duration && (
              <Metric label="Duration" value={`${Math.round(fluency.duration)}s`} />
            )}
          </div>
          <p className="text-xs text-gray-400">
            Latest: {formatRelativeDate(fluency.date)}
            {fluency.mode && <span> · {fluency.mode}</span>}
          </p>
          {fluencyHistory.length > 1 && (
            <div className="flex items-center gap-2">
              <Sparkline
                values={fluencyHistory.map(f => f.wpm)}
                width={100}
                height={24}
                color="#475569"
                showValue={false}
              />
              <span className="text-xs text-gray-400">
                {fluencyHistory.length} session{fluencyHistory.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      ) : (
        <span className="text-xs text-gray-300">No timed read data</span>
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
  const [wordScores, setWordScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function loadWordScores() {
    if (wordScores) { setExpanded(e => !e); return; }
    setLoading(true);
    const { data } = await supabase
      .from('pronunciation_assessments')
      .select('azure_word_scores, alignment')
      .eq('user_id', studentId)
      .eq('text_id', textId)
      .order('processed_at', { ascending: false })
      .limit(1)
      .single();
    setLoading(false);
    if (data?.azure_word_scores) {
      setWordScores(data.azure_word_scores);
      setExpanded(true);
    }
  }

  return (
    <div>
      <button
        onClick={loadWordScores}
        disabled={loading}
        className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {loading ? 'Loading...' : expanded ? 'Hide word scores' : 'Show word scores'}
      </button>
      {expanded && wordScores && (
        <div className="mt-3 flex flex-wrap gap-1">
          {wordScores.map((ws, i) => {
            const accuracy = ws.accuracy ?? ws.accuracyScore ?? 100;
            const color = accuracyColor(accuracy);
            const bg = accuracyBg(accuracy);
            return (
              <span
                key={i}
                className="text-xs font-medium px-1.5 py-0.5 rounded tabular-nums"
                style={{ color, backgroundColor: bg }}
                title={`${ws.word}: ${Math.round(accuracy)}%${ws.errorType && ws.errorType !== 'None' ? ` (${ws.errorType})` : ''}`}
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

function Metric({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-400 block">{label}</span>
      <span className="text-sm font-medium text-gray-700 tabular-nums">{value}</span>
    </div>
  );
}
