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
  hasRecording = false,
  assessmentStatus = null,
  assessmentError = null,
  assessmentData = null,
  onAnalyze,
  onRetryAssessment,
  wordAssessmentMap = null,
}) {
  if (recordingMode === 'idle' && assessmentStatus === 'processing') {
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm text-gray-600">Analyzing pronunciation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (recordingMode === 'idle' && assessmentStatus === 'complete' && assessmentData) {
    const accuracy = Math.round(assessmentData.overall_accuracy || 0);
    const flaggedCount = wordAssessmentMap
      ? [...wordAssessmentMap.values()].filter(a => a.accuracy < 60 || a.type === 'omission').length
      : 0;
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Overall: {accuracy}%
            </span>
            {flaggedCount > 0 && (
              <span className="text-xs text-gray-500">
                {flaggedCount} {flaggedCount === 1 ? 'word' : 'words'} to practice
              </span>
            )}
          </div>
          <button
            onClick={onStartRecording}
            className="text-xs text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors px-2 py-2 min-h-[44px] flex items-center"
          >
            Re-record
          </button>
        </div>
      </div>
    );
  }

  if (recordingMode === 'idle' && assessmentStatus === 'error') {
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <p className="text-xs text-red-500">{assessmentError || 'Assessment failed'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onRetryAssessment}
              className="text-xs text-blue-500 hover:text-blue-700 px-2 py-2 min-h-[44px]"
            >
              Retry
            </button>
            <button
              onClick={onStartRecording}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-2 min-h-[44px]"
            >
              Re-record
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (recordingMode === 'idle' && hasRecording && !assessmentStatus) {
    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <button
            onClick={onAnalyze}
            className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 text-sm font-medium bg-gray-900 text-white rounded-full hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            Analyze pronunciation
          </button>
          <div>
            <button
              onClick={onStartRecording}
              className="text-xs text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors"
            >
              Re-record instead
            </button>
          </div>
        </div>
      </div>
    );
  }

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
