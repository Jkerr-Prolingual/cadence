const SPEEDS = [0.5, 0.75, 1.0, 1.25];

export default function ShadowReadStrip({
  isPlaying,
  playbackRate,
  loopSentenceIdx,
  currentSentenceIdx,
  sentences,
  onPlayPause,
  onSpeedChange,
  onLoopSentence,
  onClearLoop,
  loopRecordingMode,
  loopRecorderAudioUrl,
  onStartLoopRecording,
  onStopLoopRecording,
  onPlayLoopRecording,
  sentenceFeedback,
  feedbackLoading,
  onRequestFeedback,
  onClearFeedback,
}) {
  const totalSentences = sentences?.length || 0;
  const isLooping = loopSentenceIdx != null;
  const activeIdx = isLooping ? loopSentenceIdx : Math.max(0, currentSentenceIdx);

  function handlePrev() {
    if (!totalSentences) return;
    onLoopSentence(Math.max(0, activeIdx - 1));
  }

  function handleNext() {
    if (!totalSentences) return;
    onLoopSentence(Math.min(totalSentences - 1, activeIdx + 1));
  }

  function handleLoopToggle() {
    if (isLooping) {
      onClearLoop();
    } else {
      onLoopSentence(Math.max(0, currentSentenceIdx));
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-2 sm:py-3">
      <div className="max-w-2xl mx-auto space-y-2">
        {/* Row 1: prev, play/pause, next, loop toggle, sentence counter */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrev}
            disabled={activeIdx <= 0}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-30"
            title="Previous sentence"
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor">
              <path d="M8 1L3 6l5 5V1z" />
            </svg>
          </button>

          <button
            onClick={onPlayPause}
            className="w-12 h-12 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="1" width="3.5" height="12" rx="1" />
                <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 1.5v11l9-5.5z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={activeIdx >= totalSentences - 1}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-30"
            title="Next sentence"
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4 1l5 5-5 5V1z" />
            </svg>
          </button>

          <button
            onClick={handleLoopToggle}
            className={`w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border-2 transition-all ${
              isLooping
                ? 'bg-amber-50 border-amber-400 text-amber-500'
                : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
            }`}
            title={isLooping ? 'Exit sentence loop' : 'Loop current sentence'}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4" />
              <path d="M12.5 1v3h-3" />
              <path d="M3.5 15v-3h3" />
            </svg>
          </button>

          {isLooping && (
            <span className="ml-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full tabular-nums">
              {loopSentenceIdx + 1} / {totalSentences}
            </span>
          )}
        </div>

        {/* Row 2: Speed + ephemeral mic */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 sm:gap-1">
            {SPEEDS.map(speed => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`px-2 py-1.5 sm:py-1 text-xs rounded transition-colors min-h-[36px] sm:min-h-0 ${
                  playbackRate === speed
                    ? 'bg-gray-900 text-white font-semibold'
                    : 'text-gray-500 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {loopRecordingMode === 'idle' && (
              <button
                onClick={onStartLoopRecording}
                className="w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border-2 border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 active:bg-red-100 transition-colors"
                title="Record yourself (practice — not saved)"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="6" r="4" />
                  <path d="M3 6a5 5 0 0 0 10 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="5" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            )}
            {loopRecordingMode === 'recording' && (
              <button
                onClick={onStopLoopRecording}
                className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-red-500 text-white animate-pulse"
                title="Stop recording"
              >
                <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="1" y="1" width="8" height="8" rx="1" />
                </svg>
              </button>
            )}
            {loopRecordingMode === 'playback' && loopRecorderAudioUrl && (
              <button
                onClick={onPlayLoopRecording}
                className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-green-600 border-2 border-green-200 hover:bg-green-50 active:bg-green-100 transition-colors"
                title="Play back your recording"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M3 1.5v11l9-5.5z" />
                </svg>
              </button>
            )}

            {(() => {
              const hasFeedback = sentenceFeedback?.has(isLooping ? loopSentenceIdx : activeIdx);
              const acc = hasFeedback ? sentenceFeedback.get(isLooping ? loopSentenceIdx : activeIdx) : null;
              const chipColor = acc != null
                ? (acc >= 95 ? 'bg-green-100 text-green-800 border-green-300'
                  : acc >= 75 ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : acc >= 50 ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-red-100 text-red-800 border-red-300')
                : '';

              if (feedbackLoading) {
                return (
                  <span className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center">
                    <svg className="w-5 h-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </span>
                );
              }

              if (hasFeedback) {
                return (
                  <span className="flex items-center gap-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${chipColor} tabular-nums`}>
                      {acc}%
                    </span>
                    <button
                      onClick={() => onClearFeedback(isLooping ? loopSentenceIdx : activeIdx)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Clear and retry"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5" fill="none">
                        <path d="M2 2l6 6M8 2l-6 6" />
                      </svg>
                    </button>
                  </span>
                );
              }

              if (loopRecordingMode === 'playback' && loopRecorderAudioUrl) {
                return (
                  <button
                    onClick={onRequestFeedback}
                    className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 border-indigo-300 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-400 active:bg-indigo-100 transition-colors"
                    title="Get pronunciation feedback"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="8" cy="8" r="7" strokeWidth="1.5" />
                      <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                );
              }

              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
