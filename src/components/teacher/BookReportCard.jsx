import { useState } from 'react';
import BarChart from './BarChart';
import PhonemeHistogram from './PhonemeHistogram';
import PhonemeGrowthTable from './PhonemeGrowthTable';
import LeitnerMiniBar from './LeitnerMiniBar';
import { cefrColor } from '../../lib/wordUtils';
import { formatRelativeDate } from '../../lib/reportUtils';

export default function BookReportCard({ book, onSelectChapter }) {
  const [expanded, setExpanded] = useState(true);
  const [showCards, setShowCards] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Book header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">{book.bookTitle}</span>
          <span className="text-xs text-gray-400">
            {book.chapters.length} chapter{book.chapters.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-gray-400 text-xs">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-6">
          {/* WPM + Accuracy + Fluency charts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <BarChart
              values={book.wpm.values}
              labels={book.wpm.labels}
              color="#475569"
              delta={book.wpm.delta}
              label="WPM by Chapter"
            />
            <BarChart
              values={book.accuracy.values}
              labels={book.accuracy.labels}
              color="#475569"
              delta={book.accuracy.delta}
              label="Accuracy by Chapter"
            />
            <BarChart
              values={book.fluency?.values || []}
              labels={book.fluency?.labels || []}
              color="#475569"
              delta={book.fluency?.delta}
              label="Fluency by Chapter"
            />
          </div>

          {/* Phoneme histogram — full width */}
          {book.phonemes.histogram.length > 0 && (
            <PhonemeHistogram phonemes={book.phonemes.histogram} />
          )}

          {/* Phoneme growth table — full width */}
          {book.phonemes.growthTable.length > 0 && (
            <PhonemeGrowthTable rows={book.phonemes.growthTable} />
          )}

          {/* Exercises — full width */}
          <div className="border border-gray-200 rounded-lg p-4">
            <span className="text-xs font-medium text-gray-500 mb-3 block">Exercises</span>
            {book.exercises.values.length > 0 ? (
              <div className="flex items-center gap-4">
                <BarChart
                  values={book.exercises.values}
                  labels={book.exercises.labels}
                  color="#475569"
                  height={90}
                />
                <span className="text-sm text-gray-500">
                  Avg: <span className="font-medium text-gray-700">{book.exercises.bookAvg}%</span>
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-300">No exercise data</span>
            )}
          </div>

          {/* Flashcards — full width */}
          <div className="border border-gray-200 rounded-lg p-4">
            <span className="text-xs font-medium text-gray-500 mb-3 block">Flashcards</span>
            <div className="flex items-center gap-3">
              <LeitnerMiniBar distribution={book.flashcards.distribution} width={100} height={16} />
              <span className="text-xs text-gray-500">
                {book.flashcards.total} cards
                {book.flashcards.mastered > 0 && (
                  <span className="text-gray-400"> · {book.flashcards.mastered} mastered</span>
                )}
                {book.flashcards.overdue > 0 && (
                  <span className="text-amber-500"> · {book.flashcards.overdue} overdue</span>
                )}
              </span>
            </div>
            {book.flashcards.cards?.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowCards(c => !c)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  {showCards ? 'Hide card list' : 'Show card list'}
                </button>
                {showCards && (
                  <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-2.5 py-1.5 text-left font-medium text-gray-500">Word</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-gray-500">Box</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-gray-500">CEFR</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-gray-500">Last Review</th>
                          <th className="px-2.5 py-1.5 text-right font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...book.flashcards.cards].sort((a, b) => a.box - b.box).map(card => (
                          <tr key={card.word} className="border-b border-gray-50">
                            <td className="px-2.5 py-1.5 text-gray-700">{card.word}</td>
                            <td className="px-2.5 py-1.5 text-right tabular-nums text-gray-500">{card.box}</td>
                            <td className="px-2.5 py-1.5 text-right">
                              <span
                                className="inline-block w-2 h-2 rounded-full mr-1"
                                style={{ backgroundColor: cefrColor(card.cefr) }}
                              />
                              <span className="text-gray-500">{card.cefr || '—'}</span>
                            </td>
                            <td className="px-2.5 py-1.5 text-right text-gray-400">
                              {card.lastReview ? formatRelativeDate(card.lastReview) : '—'}
                            </td>
                            <td className="px-2.5 py-1.5 text-right">
                              {card.overdue ? (
                                <span className="text-amber-500 font-medium">overdue</span>
                              ) : card.box >= 4 ? (
                                <span className="text-green-600">mastered</span>
                              ) : (
                                <span className="text-gray-400">learning</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chapter links */}
          <div>
            <span className="text-xs font-medium text-gray-500 mb-2 block">Chapters</span>
            <div className="flex flex-wrap gap-1.5">
              {book.chapters.map(ch => (
                <button
                  key={ch.textId}
                  onClick={() => onSelectChapter(ch.textId)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
