function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RecordReviewStrip({
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
}) {
  if (recordingMode === 'idle') {
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-xs text-gray-500">
            Read the text aloud. You'll get pronunciation feedback afterward.
          </p>
          <button
            onClick={onStartRecording}
            className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 text-sm font-medium bg-gray-900 text-white rounded-full hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="6" r="4" />
              <path d="M3 6a5 5 0 0 0 10 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" />
              <line x1="5" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Start recording
          </button>
        </div>
      </div>
    );
  }

  if (recordingMode === 'recording') {
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-900 tabular-nums">
              {formatElapsed(recordingElapsed)}
            </span>
            <span className="text-xs text-red-400">/ 5:00</span>
          </div>
          <button
            onClick={onStopRecording}
            className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 text-sm font-medium bg-red-500 text-white rounded-full hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="10" height="10" rx="1.5" />
            </svg>
            Stop recording
          </button>
        </div>
      </div>
    );
  }

  if (recordingMode === 'review') {
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-xs text-gray-500">
            Review your recording. Save to get pronunciation feedback.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onListenBack}
              className="px-4 py-2.5 sm:py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Listen back
            </button>
            <button
              onClick={onSaveRecording}
              disabled={saving}
              className="px-4 py-2.5 sm:py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & get feedback'}
            </button>
            <button
              onClick={onDiscardRecording}
              className="px-4 py-2.5 sm:py-2 text-xs font-medium text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors"
            >
              Discard
            </button>
          </div>
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          {recorderError && <p className="text-xs text-red-500">{recorderError}</p>}
        </div>
      </div>
    );
  }

  return null;
}
