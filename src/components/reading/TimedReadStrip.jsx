function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimedReadStrip({
  mode,
  elapsed,
  result,
  wpmHistory,
  onStart,
  onCancel,
  onDone,
  onSave,
  onDiscard,
}) {
  if (mode === 'idle' || mode === 'pending') {
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-xs text-gray-500">
            Read at your natural pace. The clock starts when you tap the button. Tap any word to mark where you stopped.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 text-sm font-medium bg-amber-600 text-white rounded-full hover:bg-amber-700 active:bg-amber-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="9" r="6" />
              <line x1="8" y1="9" x2="8" y2="6" />
              <line x1="8" y1="1" x2="8" y2="3" />
              <line x1="6" y1="1" x2="10" y2="1" />
            </svg>
            Start the clock
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'active') {
    return (
      <div className="border-t border-red-200 bg-red-50 px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-sm font-semibold text-red-900 tabular-nums">
              {formatElapsed(elapsed)}
            </span>
            <span className="text-xs text-red-700 hidden sm:inline">Tap any word to mark where you stopped</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onCancel}
              className="px-3 py-2 sm:py-1.5 text-xs text-gray-600 hover:text-gray-800 active:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onDone}
              className="px-4 py-2 sm:py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors"
            >
              Done reading
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'result' && result) {
    const tooFast = result.wpm > 500;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm sm:mx-4 overflow-hidden">
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Reading complete</h3>
            <p className="text-sm text-gray-500 mt-1">
              {tooFast
                ? 'That seems too fast to be a real reading — try again?'
                : 'Save this session to your fluency record?'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-gray-50">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {formatElapsed(result.elapsed)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {result.wordsRead.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Words</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold tabular-nums ${tooFast ? 'text-red-600' : 'text-gray-900'}`}>
                {result.wpm}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">WPM</p>
            </div>
          </div>

          {wpmHistory.length > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Previous sessions</p>
              <div className="flex items-end gap-1 h-10">
                {wpmHistory.map((wpm, i) => {
                  const max = Math.max(...wpmHistory, result.wpm);
                  const h = max > 0 ? (wpm / max) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full bg-gray-200 rounded-sm min-h-[2px]"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[9px] text-gray-400 tabular-nums">{wpm}</span>
                    </div>
                  );
                })}
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full bg-amber-400 rounded-sm min-h-[2px]"
                    style={{ height: `${Math.max(...wpmHistory, result.wpm) > 0 ? (result.wpm / Math.max(...wpmHistory, result.wpm)) * 100 : 0}%` }}
                  />
                  <span className="text-[9px] text-amber-600 font-medium tabular-nums">{result.wpm}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-gray-100">
            <button
              onClick={onDiscard}
              className="flex-1 px-4 py-2.5 sm:py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {tooFast ? 'Dismiss' : 'Discard'}
            </button>
            {!tooFast && (
              <button
                onClick={onSave}
                className="flex-1 px-4 py-2.5 sm:py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors"
              >
                Save session
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
