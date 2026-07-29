import { useState } from 'react';
import { ipaPhonemes } from '../../data/ipaPhonemes';
import MouthDiagram from './MouthDiagram';
import { getUILabel } from '../../lib/locales';

function accuracyColor(score) {
  if (score >= 85) return '#7e22ce';
  if (score >= 70) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  if (score >= 30) return '#ea580c';
  return '#dc2626';
}

function accuracyBg(score) {
  if (score >= 85) return '#faf5ff';
  if (score >= 70) return '#f0fdf4';
  if (score >= 50) return '#fefce8';
  if (score >= 30) return '#fff7ed';
  return '#fef2f2';
}

function PhonemeCard({ phoneme, median, count, l1, wordExamples = [], defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const pd = ipaPhonemes[phoneme];
  const color = accuracyColor(median);
  const bg = accuracyBg(median);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
      >
        <span
          className="text-2xl font-mono font-bold w-12 text-center rounded px-1 py-0.5"
          style={{ color, backgroundColor: bg }}
        >
          /{phoneme}/
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums" style={{ color }}>
              {median}%
            </span>
            <span className="text-xs text-gray-400">
              {getUILabel('heardTimes', l1).replace('{n}', count)}
            </span>
          </div>
          {pd && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {getUILabel('asIn', l1)}: <strong>{pd.example}</strong> ({pd.exampleHighlight})
            </p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          {pd && (
            <div className="flex gap-3 mt-3">
              <div className="w-20 h-20 flex-shrink-0">
                <MouthDiagram phonemeData={pd} />
              </div>
              <p className="text-sm text-gray-700 leading-snug flex-1">
                {pd.instructions?.[l1] || pd.instruction}
              </p>
            </div>
          )}
          {wordExamples.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {wordExamples.map((ex, i) => (
                <span
                  key={`${ex.word}-${i}`}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: accuracyBg(ex.score), color: accuracyColor(ex.score) }}
                >
                  <span className="font-medium">{ex.word}</span>
                  <span className="opacity-70">{ex.score}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value }) {
  if (value == null) return null;
  const color = accuracyColor(value);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-9 text-right" style={{ color }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

export default function PhonemeSummaryReport({ phonemeSession, phonemeHistory, phonemeWordExamples, l1, onClose }) {
  const [showAll, setShowAll] = useState(false);

  if (!phonemeSession) return null;

  const { phoneme_medians, phoneme_counts, weak_phonemes, overall_accuracy, fluency_score, prosody_score, words_assessed } = phonemeSession;

  const allPhonemes = Object.entries(phoneme_medians)
    .sort((a, b) => a[1] - b[1])
    .map(([phoneme, median]) => ({ phoneme, median, count: phoneme_counts?.[phoneme] || 0 }));

  const weakSet = new Set(weak_phonemes || []);
  const weakEntries = allPhonemes.filter(p => weakSet.has(p.phoneme));
  const otherEntries = allPhonemes.filter(p => !weakSet.has(p.phoneme));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {getUILabel('phonemeReport', l1)}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-4 space-y-5">
          {/* Overall scores */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">{getUILabel('overallScores', l1)}</h3>
            <ScoreBar label={getUILabel('accuracy', l1)} value={overall_accuracy} />
            <ScoreBar label={getUILabel('fluency', l1)} value={fluency_score} />
            <ScoreBar label={getUILabel('prosody', l1)} value={prosody_score} />
            {words_assessed != null && (
              <p className="text-xs text-gray-400">{words_assessed} {getUILabel('wordsAssessed', l1)}</p>
            )}
          </div>

          {/* Practice words — all words containing any weak phoneme */}
          {weakEntries.length > 0 && phonemeWordExamples && (() => {
            const weakSet2 = new Set(weakEntries.map(p => p.phoneme));
            const wordMap = new Map();
            for (const phoneme of weakSet2) {
              for (const ex of (phonemeWordExamples[phoneme] || [])) {
                const key = ex.word.toLowerCase();
                if (!wordMap.has(key)) {
                  wordMap.set(key, { word: ex.word, phonemes: [], worstScore: ex.score });
                }
                const entry = wordMap.get(key);
                entry.phonemes.push({ phoneme, score: ex.score });
                if (ex.score < entry.worstScore) entry.worstScore = ex.score;
              }
            }
            const practiceWords = [...wordMap.values()].sort((a, b) => a.worstScore - b.worstScore);
            if (practiceWords.length === 0) return null;
            return (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  {getUILabel('wordsToPractice', l1)}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {practiceWords.map((pw, i) => (
                    <span
                      key={`${pw.word}-${i}`}
                      className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full border"
                      style={{ borderColor: accuracyColor(pw.worstScore) + '40', backgroundColor: accuracyBg(pw.worstScore) }}
                    >
                      <span className="font-medium" style={{ color: accuracyColor(pw.worstScore) }}>{pw.word}</span>
                      <span className="text-xs opacity-60" style={{ color: accuracyColor(pw.worstScore) }}>
                        {pw.phonemes.map(p => `/${p.phoneme}/`).join(' ')}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Weak phonemes */}
          {weakEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {getUILabel('soundsThatNeedWork', l1)}
              </h3>
              <div className="space-y-2">
                {weakEntries.map(p => (
                  <PhonemeCard
                    key={p.phoneme}
                    phoneme={p.phoneme}
                    median={p.median}
                    count={p.count}
                    l1={l1}
                    wordExamples={phonemeWordExamples?.[p.phoneme] || []}
                    defaultExpanded={weakEntries.length <= 3}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All sounds (collapsed) */}
          {otherEntries.length > 0 && (
            <div>
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {getUILabel('allSounds', l1)} ({otherEntries.length})
              </button>
              {showAll && (
                <div className="space-y-2 mt-2">
                  {otherEntries.map(p => (
                    <PhonemeCard
                      key={p.phoneme}
                      phoneme={p.phoneme}
                      median={p.median}
                      count={p.count}
                      l1={l1}
                      wordExamples={phonemeWordExamples?.[p.phoneme] || []}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Session history */}
          {phonemeHistory?.length > 1 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {getUILabel('sessionHistory', l1)}
              </h3>
              <div className="space-y-1">
                {phonemeHistory.map((s, i) => {
                  const date = new Date(s.session_date);
                  const isLatest = i === phonemeHistory.length - 1;
                  return (
                    <div
                      key={s.id || i}
                      className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${
                        isLatest ? 'bg-blue-50 font-medium' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-600">
                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums" style={{ color: accuracyColor(s.overall_accuracy) }}>
                          {Math.round(s.overall_accuracy)}%
                        </span>
                        <span className="text-gray-400">
                          {s.words_assessed} {getUILabel('wordsAssessed', l1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
