import { useRef } from 'react';
import { formatTime } from '../../lib/audioUtils';

const SPEEDS = [0.5, 0.75, 1.0, 1.25];

function findCurrentSentenceIdx(sentences, currentTime) {
  for (const s of sentences) {
    if (s.startTime != null && s.endTime != null) {
      if (currentTime >= s.startTime && currentTime <= s.endTime + 0.1) {
        return s.sentenceIdx;
      }
    }
  }
  return -1;
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioTransport({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  loopSentenceIdx,
  sentences,
  onPlayPause,
  onSeek,
  onSpeedChange,
  onClearLoop,
  onLoopSentence,
  // Recording props
  recordingMode,
  recordingElapsed,
  onStartRecording,
  onStopRecording,
  onListenBack,
  onSaveRecording,
  onDiscardRecording,
  saving,
  saveError,
  recorderError,
  // Loop recording props
  loopRecordingMode,
  loopRecorderAudioUrl,
  onStartLoopRecording,
  onStopLoopRecording,
  onPlayLoopRecording,
}) {
  const totalSentences = sentences?.length || 0;
  const activeSentence = loopSentenceIdx ?? findCurrentSentenceIdx(sentences || [], currentTime);

  function handleToggleLoop() {
    if (loopSentenceIdx != null) {
      onClearLoop();
    } else if (activeSentence >= 0 && onLoopSentence) {
      onLoopSentence(activeSentence);
    }
  }

  function handlePrevSentence() {
    if (!sentences?.length || !onLoopSentence) return;
    const target = loopSentenceIdx != null
      ? Math.max(0, loopSentenceIdx - 1)
      : Math.max(0, activeSentence - 1);
    onLoopSentence(target);
  }

  function handleNextSentence() {
    if (!sentences?.length || !onLoopSentence) return;
    const max = sentences.length - 1;
    const target = loopSentenceIdx != null
      ? Math.min(max, loopSentenceIdx + 1)
      : Math.min(max, activeSentence + 1);
    onLoopSentence(target);
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-2 sm:py-3">
      <div className="max-w-2xl mx-auto space-y-2">
        {/* Row 1: Play + Scrubber + Mic */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onPlayPause}
            disabled={recordingMode === 'recording'}
            className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 transition-colors flex-shrink-0 disabled:opacity-40"
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="1" width="3.5" height="12" rx="1" />
                <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 1.5v11l9-5.5z" />
              </svg>
            )}
          </button>

          <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-xs text-gray-400 w-8 sm:w-10 text-right tabular-nums flex-shrink-0">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime || 0}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="flex-1 h-2 sm:h-1 accent-gray-900 cursor-pointer min-w-0"
            />
            <span className="text-xs text-gray-400 w-8 sm:w-10 tabular-nums flex-shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {loopSentenceIdx == null && recordingMode === 'idle' && (
            <button
              onClick={onStartRecording}
              className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 active:text-red-600 transition-colors flex-shrink-0"
              title="Record yourself reading"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="6" r="4" />
                <path d="M3 6a5 5 0 0 0 10 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" />
                <line x1="5" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          )}

          {recordingMode === 'recording' && (
            <button
              onClick={onStopRecording}
              className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-red-500 text-white animate-pulse flex-shrink-0"
              title="Stop recording"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="2" width="10" height="10" rx="1.5" />
              </svg>
            </button>
          )}
        </div>

        {/* Row 2: Speed + Loop controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 sm:gap-1">
            {SPEEDS.map((speed) => (
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

          {totalSentences > 0 && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={handlePrevSentence}
                className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                title="Previous sentence"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M8 1L3 6l5 5V1z" />
                </svg>
              </button>

              <button
                onClick={handleToggleLoop}
                className={`px-2 py-1.5 sm:py-1 text-xs rounded transition-colors flex items-center gap-1 min-h-[36px] sm:min-h-0 ${
                  loopSentenceIdx != null
                    ? 'bg-amber-100 text-amber-800 font-semibold'
                    : 'text-gray-500 hover:bg-gray-100 active:bg-gray-200'
                }`}
                title={loopSentenceIdx != null ? 'Clear loop' : 'Loop current sentence'}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4" />
                  <path d="M12.5 1v3h-3" fill="none" />
                  <path d="M3.5 15v-3h3" fill="none" />
                </svg>
                {loopSentenceIdx != null && (
                  <span>{loopSentenceIdx + 1}/{totalSentences}</span>
                )}
              </button>

              <button
                onClick={handleNextSentence}
                className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                title="Next sentence"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M4 1l5 5-5 5V1z" />
                </svg>
              </button>

              {loopSentenceIdx != null && (
                <>
                  {loopRecordingMode === 'idle' && (
                    <button
                      onClick={onStartLoopRecording}
                      className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 active:text-red-600 transition-colors ml-1"
                      title="Record yourself (practice — not saved)"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
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
                      className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-red-500 text-white animate-pulse ml-1"
                      title="Stop recording"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <rect x="1" y="1" width="8" height="8" rx="1" />
                      </svg>
                    </button>
                  )}
                  {loopRecordingMode === 'playback' && loopRecorderAudioUrl && (
                    <button
                      onClick={onPlayLoopRecording}
                      className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded text-green-600 hover:bg-green-50 active:bg-green-100 transition-colors ml-1"
                      title="Play back your recording"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M3 1.5v11l9-5.5z" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recording elapsed time */}
      {recordingMode === 'recording' && (
        <div className="max-w-2xl mx-auto mt-2 flex items-center gap-2">
          <span className="text-xs text-red-500 font-medium animate-pulse">Recording</span>
          <span className="text-xs text-red-400 tabular-nums">{formatElapsed(recordingElapsed)} / 5:00</span>
        </div>
      )}

      {/* Recording review panel */}
      {recordingMode === 'review' && (
        <div className="max-w-2xl mx-auto mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <button
            onClick={onListenBack}
            className="px-3 py-2 sm:py-1.5 text-xs font-medium bg-white border border-gray-200 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Listen back
          </button>
          <button
            onClick={onSaveRecording}
            disabled={saving}
            className="px-3 py-2 sm:py-1.5 text-xs font-medium bg-gray-900 text-white rounded hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onDiscardRecording}
            className="px-3 py-2 sm:py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors"
          >
            Discard
          </button>
          {saveError && <span className="text-xs text-red-500">{saveError}</span>}
          {recorderError && <span className="text-xs text-red-500">{recorderError}</span>}
        </div>
      )}
    </div>
  );
}
