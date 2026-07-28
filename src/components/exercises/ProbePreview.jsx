import { useState } from 'react';
import { cefrColor } from '../../lib/wordUtils';

export default function ProbePreview({ probes, studentAnswers, onClose }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!probes || probes.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400 text-center">No exercises available for this text.</div>
    );
  }

  const typeLabels = { meaning: 'Meaning', cloze: 'Cloze', context: 'Context' };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Exercise questions ({probes.length})
            </h3>
            {studentAnswers && (
              <p className="text-xs text-gray-400 mt-0.5">
                Score: {studentAnswers.filter(a => a.correct).length}/{studentAnswers.length}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3">
          <div className="space-y-1">
            {probes.map((probe, i) => {
              const answer = studentAnswers?.[i];
              const isExpanded = expandedIdx === i;

              let statusIcon = null;
              if (answer) {
                statusIcon = answer.correct
                  ? <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] flex-shrink-0">✓</span>
                  : <span className="w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center text-[10px] flex-shrink-0">✗</span>;
              }

              return (
                <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">{i + 1}</span>
                    {statusIcon}
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">
                      {typeLabels[probe.questionType] || probe.questionType}
                    </span>
                    {probe.cefr && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded text-white flex-shrink-0"
                        style={{ backgroundColor: cefrColor(probe.cefr) }}
                      >
                        {probe.cefr}
                      </span>
                    )}
                    <span className="text-sm text-gray-700 truncate">{probe.word}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-300 ml-auto flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-50 space-y-2">
                      {probe.sentence && (
                        <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">
                          "{probe.sentence}"
                        </p>
                      )}
                      <p className="text-sm text-gray-800">{probe.question}</p>
                      <div className="space-y-1">
                        {[probe.correct, ...probe.distractors].map((opt, j) => {
                          const isCorrectOpt = j === 0;
                          let optStyle = 'text-gray-600';
                          if (isCorrectOpt) optStyle = 'text-green-700 font-medium';
                          if (answer && !isCorrectOpt) {
                            const allOpts = [probe.correct, ...probe.distractors];
                            const shuffledOpts = probe._shuffledOptions || allOpts.map((text, idx) => ({ text, isCorrect: idx === 0 }));
                            const selectedOpt = shuffledOpts[answer.selectedIdx];
                            if (selectedOpt && selectedOpt.text === opt && !selectedOpt.isCorrect) {
                              optStyle = 'text-red-600 line-through';
                            }
                          }
                          return (
                            <div key={j} className={`text-xs px-2 py-1 rounded ${isCorrectOpt ? 'bg-green-50' : ''} ${optStyle}`}>
                              {isCorrectOpt ? '✓ ' : '  '}{opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
