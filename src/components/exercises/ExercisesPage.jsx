import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { cefrColor } from '../../lib/wordUtils';
import { dbGet, dbPut } from '../../lib/db';
import { groupTextsByBook } from '../../lib/reportUtils';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuestionCard({ probe, index, total, onAnswer, answered, selectedIdx, correctIdx }) {
  const isCorrect = answered && selectedIdx === correctIdx;
  const options = useMemo(() => {
    if (probe._shuffledOptions) return probe._shuffledOptions;
    const opts = [probe.correct, ...probe.distractors].map((text, origIdx) => ({
      text,
      isCorrect: origIdx === 0,
    }));
    return shuffleArray(opts);
  }, [probe]);

  if (!probe._shuffledOptions) probe._shuffledOptions = options;

  const typeLabels = { meaning: 'Meaning', cloze: 'Fill in the blank', context: 'Context' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{index + 1} / {total}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{typeLabels[probe.questionType] || probe.questionType}</span>
          {probe.cefr && (
            <span
              className="text-xs px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: cefrColor(probe.cefr) }}
            >
              {probe.cefr}
            </span>
          )}
        </div>
      </div>

      {probe.questionType === 'meaning' && probe.sentence && (
        <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
          "{probe.sentence}"
        </p>
      )}

      <p className="text-base font-medium text-gray-900">{probe.question}</p>

      <div className="space-y-2">
        {options.map((opt, i) => {
          let style = 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 cursor-pointer';
          if (answered) {
            if (opt.isCorrect) {
              style = 'border-green-500 bg-green-50 text-green-900';
            } else if (i === selectedIdx && !opt.isCorrect) {
              style = 'border-red-400 bg-red-50 text-red-800';
            } else {
              style = 'border-gray-100 text-gray-400';
            }
          }
          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(i, opt.isCorrect)}
              disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${style}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {answered && probe.questionType === 'meaning' && !isCorrect && (
        <p className="text-xs text-gray-500">
          <span className="font-medium">{probe.word}</span> means <span className="font-medium">{probe.correct}</span> in this context.
        </p>
      )}
    </div>
  );
}

function ExerciseRunner({ probes, textTitle, onFinish }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answered, setAnswered] = useState(false);

  const probe = probes[currentIdx];
  const isLast = currentIdx === probes.length - 1;
  const score = answers.filter(a => a.correct).length;

  function handleAnswer(optIdx, isCorrect) {
    setSelectedIdx(optIdx);
    setAnswered(true);
    setAnswers(prev => [...prev, { probeIndex: currentIdx, selectedIdx: optIdx, correct: isCorrect }]);
  }

  function handleNext() {
    if (isLast) {
      onFinish(answers);
      return;
    }
    setCurrentIdx(prev => prev + 1);
    setSelectedIdx(null);
    setAnswered(false);
  }

  if (!probe) return null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-500">{textTitle}</h2>
          {answers.length > 0 && (
            <span className="text-xs text-gray-400">
              {score}/{answers.length} correct
            </span>
          )}
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + (answered ? 1 : 0)) / probes.length) * 100}%` }}
          />
        </div>
      </div>

      <QuestionCard
        key={currentIdx}
        probe={probe}
        index={currentIdx}
        total={probes.length}
        onAnswer={handleAnswer}
        answered={answered}
        selectedIdx={selectedIdx}
      />

      {answered && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {isLast ? 'See results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}

function ResultsSummary({ score, total, answers, probes, onRetry, onBack }) {
  const pct = Math.round((score / total) * 100);
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <p className={`text-5xl font-bold ${color}`}>{pct}%</p>
        <p className="text-sm text-gray-500 mt-2">{score} out of {total} correct</p>
      </div>

      <div className="space-y-2 mb-8">
        {probes.map((probe, i) => {
          const answer = answers[i];
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                answer?.correct ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                answer?.correct ? 'bg-green-500 text-white' : 'bg-red-400 text-white'
              }`}>
                {answer?.correct ? '✓' : '✗'}
              </span>
              <span className="text-gray-700 truncate">{probe.word}</span>
              {probe.cefr && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded text-white flex-shrink-0"
                  style={{ backgroundColor: cefrColor(probe.cefr) }}
                >
                  {probe.cefr}
                </span>
              )}
              {!answer?.correct && (
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">→ {probe.correct}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back to exercises
        </button>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function ExercisesPage() {
  const { user, l1 } = useAuth();
  const [books, setBooks] = useState([]);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState(null);
  const [results, setResults] = useState(null);
  const [savedResults, setSavedResults] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [textsRes, booksRes] = await Promise.all([
      supabase.from('curated_texts')
        .select('id, title, author, cefr_estimate, book_id, chapter_order, analysis')
        .eq('status', 'published'),
      supabase.from('books').select('id, title').eq('status', 'published'),
    ]);
    setTexts(textsRes.data || []);
    setBooks(booksRes.data || []);

    const resultMap = {};
    for (const t of (textsRes.data || [])) {
      const saved = await dbGet('exerciseResults', t.id);
      if (saved) resultMap[t.id] = saved;
    }
    setSavedResults(resultMap);
    setLoading(false);
  }

  const textsWithProbes = useMemo(() => {
    return texts.filter(t => t.analysis?.probePool?.length > 0);
  }, [texts]);

  const grouped = useMemo(
    () => groupTextsByBook(textsWithProbes, books),
    [textsWithProbes, books]
  );

  async function handleFinish(answers) {
    const score = answers.filter(a => a.correct).length;
    const total = activeExercise.probes.length;
    const result = {
      textId: activeExercise.textId,
      score,
      total,
      completedAt: new Date().toISOString(),
      answers,
    };
    await dbPut('exerciseResults', result);
    setSavedResults(prev => ({ ...prev, [activeExercise.textId]: result }));

    if (user) {
      await supabase.from('exercise_results').upsert({
        user_id: user.id,
        text_id: activeExercise.textId,
        score,
        total,
        completed_at: result.completedAt,
        answers,
      }, { onConflict: 'user_id,text_id' }).catch(() => {});
    }

    setResults({ score, total, answers, probes: activeExercise.probes });
  }

  function handleStartExercise(text) {
    const probes = text.analysis.probePool.map(p => ({ ...p }));
    setActiveExercise({ textId: text.id, title: text.title, probes: shuffleArray(probes) });
    setResults(null);
  }

  function handleRetry() {
    const probes = activeExercise.probes.map(p => {
      const copy = { ...p };
      delete copy._shuffledOptions;
      return copy;
    });
    setActiveExercise(prev => ({ ...prev, probes: shuffleArray(probes) }));
    setResults(null);
  }

  function handleBack() {
    setActiveExercise(null);
    setResults(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }

  if (results) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <ResultsSummary
            score={results.score}
            total={results.total}
            answers={results.answers}
            probes={results.probes}
            onRetry={handleRetry}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  if (activeExercise) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <button
            onClick={handleBack}
            className="text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            ← Back to exercises
          </button>
          <ExerciseRunner
            probes={activeExercise.probes}
            textTitle={activeExercise.title}
            onFinish={handleFinish}
          />
        </div>
      </div>
    );
  }

  if (textsWithProbes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg">No exercises available</p>
          <p className="text-sm mt-2">Exercises will appear here when texts with vocabulary probes are published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Exercises</h1>

        {books.filter(b => grouped.byBook[b.id]?.length).map(book => (
          <div key={book.id} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{book.title}</h2>
            <div className="space-y-2">
              {grouped.byBook[book.id].map(text => {
                const probeCount = text.analysis.probePool.length;
                const saved = savedResults[text.id];
                return (
                  <button
                    key={text.id}
                    onClick={() => handleStartExercise(text)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cefrColor(text.cefr_estimate) }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {text.chapter_order != null ? `Ch. ${text.chapter_order}: ` : ''}{text.title}
                        </p>
                        <p className="text-xs text-gray-400">{probeCount} questions</p>
                      </div>
                    </div>
                    {saved ? (
                      <span className={`text-xs font-medium flex-shrink-0 ${
                        saved.score / saved.total >= 0.8 ? 'text-green-600' :
                        saved.score / saved.total >= 0.6 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {saved.score}/{saved.total}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 flex-shrink-0">Not started</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {grouped.standalone.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Other texts</h2>
            <div className="space-y-2">
              {grouped.standalone.map(text => {
                const probeCount = text.analysis.probePool.length;
                const saved = savedResults[text.id];
                return (
                  <button
                    key={text.id}
                    onClick={() => handleStartExercise(text)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cefrColor(text.cefr_estimate) }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{text.title}</p>
                        <p className="text-xs text-gray-400">{probeCount} questions</p>
                      </div>
                    </div>
                    {saved ? (
                      <span className={`text-xs font-medium flex-shrink-0 ${
                        saved.score / saved.total >= 0.8 ? 'text-green-600' :
                        saved.score / saved.total >= 0.6 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {saved.score}/{saved.total}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 flex-shrink-0">Not started</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
