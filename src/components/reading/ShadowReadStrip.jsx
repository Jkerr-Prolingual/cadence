import { formatTime } from '../../lib/audioUtils';

const SPEEDS = [0.5, 0.75, 1.0, 1.25];

export default function ShadowReadStrip({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  loopSentenceIdx,
  sentences,
  onPlayPause,
  onSeek,
  onSpeedChange,
  onLoopSentence,
  onClearLoop,
  loopRecordingMode,
  loopRecorderAudioUrl,
  onStartLoopRecording,
  onStopLoopRecording,
  onPlayLoopRecording,
}) {
  const totalSentences = sentences?.length || 0;
  const currentIdx = loopSentenceIdx ?? 0;

  function handlePrev() {
    if (!sentences?.length || !onLoopSentence) return;
    onLoopSentence(Math.max(0, currentIdx - 1));
  }

  function handleNext() {
    if (!sentences?.length || !onLoopSentence) return;
    onLoopSentence(Math.min(sentences.length - 1, currentIdx + 1));
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-2 sm:py-3">
      <div className="max-w-2xl mx-auto space-y-2">
        {/* Instructions */}
        {loopSentenceIdx == null && (
          <p className="text-xs text-gray-500 text-center">
            Listen to each sentence, then repeat. Use the arrows to navigate and the mic to record yourself.
          </p>
        )}

        {/* Row 1: Sentence navigation — large and central */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIdx <= 0}
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
            disabled={currentIdx >= totalSentences - 1}
            className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-30"
            title="Next sentence"
          >
            <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4 1l5 5-5 5V1z" />
            </svg>
          </button>

          {/* Loop indicator */}
          {loopSentenceIdx != null && (
            <span className="ml-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full tabular-nums">
              {loopSentenceIdx + 1} / {totalSentences}
            </span>
          )}
        </div>

        {/* Row 2: Speed + Ephemeral mic */}
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
            {loopSentenceIdx != null && (
              <button
                onClick={onClearLoop}
                className="px-2 py-1.5 sm:py-1 text-xs text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors min-h-[36px] sm:min-h-0"
              >
                Exit loop
              </button>
            )}

            {loopRecordingMode === 'idle' && (
              <button
                onClick={onStartLoopRecording}
                className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 active:text-red-600 transition-colors"
                title="Record yourself (practice — not saved)"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
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
          </div>
        </div>
      </div>
    </div>
  );
}
