import { useState } from 'react';
import { getUILabel } from '../../lib/locales';

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
  l1 = 'en',
  hasRecording = false,
  assessmentStatus = null,
  assessmentError = null,
  assessmentData = null,
  onAnalyzePronunciation,
  onStartFresh,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const t = (key) => getUILabel(key, l1);

  if (recordingMode === 'recording') {
    const m = Math.floor(recordingElapsed / 60);
    const s = Math.floor(recordingElapsed % 60);
    const elapsed = `${m}:${s.toString().padStart(2, '0')}`;

    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-900 tabular-nums">
              {elapsed}
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
            {t('stopRecording')}
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
            {t('reviewPrompt')}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onListenBack}
              className="px-4 py-2.5 sm:py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {t('listenBack')}
            </button>
            <button
              onClick={onSaveRecording}
              disabled={saving}
              className="px-4 py-2.5 sm:py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving ? t('saving') : t('save')}
            </button>
            <button
              onClick={onDiscardRecording}
              className="px-4 py-2.5 sm:py-2 text-xs font-medium text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors"
            >
              {t('discard')}
            </button>
          </div>
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          {recorderError && <p className="text-xs text-red-500">{recorderError}</p>}
        </div>
      </div>
    );
  }

  // idle mode — either no recording yet, or has a saved recording
  if (hasRecording) {
    const isComplete = assessmentStatus === 'complete';
    const isProcessing = assessmentStatus === 'processing';
    const isError = assessmentStatus === 'error';
    const accuracy = assessmentData?.overall_accuracy;

    return (
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          {isProcessing && (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="text-sm text-gray-500">{t('analyzingPronunciation')}</span>
            </div>
          )}

          {isComplete && accuracy != null && (
            <div className="flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700">
                {t('accuracy')}: <strong className="tabular-nums">{Math.round(accuracy)}%</strong>
              </span>
              {assessmentData?.azure_fluency_score != null && (
                <span className="text-xs text-gray-400">
                  {t('fluency')}: {Math.round(assessmentData.azure_fluency_score)}%
                </span>
              )}
            </div>
          )}

          {isComplete && accuracy == null && (
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-500">{t('feedbackAvailable')}</span>
            </div>
          )}

          {isError && (
            <p className="text-xs text-red-500">{assessmentError || t('analysisFailed')}</p>
          )}

          <div className="flex items-center justify-center gap-2">
            {!isComplete && !isProcessing && (
              <button
                onClick={onAnalyzePronunciation}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {t('getFeedback')}
              </button>
            )}

            {isError && (
              <button
                onClick={onAnalyzePronunciation}
                className="px-4 py-2.5 sm:py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors"
              >
                {t('retry')}
              </button>
            )}

            <button
              onClick={() => {
                setConfirmDelete(false);
                onStartRecording();
              }}
              disabled={isProcessing}
              className="px-4 py-2.5 sm:py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {t('reRecord')}
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isProcessing}
                className="px-3 py-2.5 sm:py-2 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title={t('resetRecording')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => { setConfirmDelete(false); onStartFresh(); }}
                className="px-3 py-2.5 sm:py-2 text-xs font-medium text-red-600 hover:text-red-700 active:text-red-800 transition-colors"
              >
                {t('confirmDelete')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No recording yet
  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 sm:py-4">
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <p className="text-xs text-gray-500">
          {t('recordPrompt')}
        </p>
        <button
          onClick={onStartRecording}
          className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 text-sm font-medium bg-red-500 text-white rounded-full hover:bg-red-600 active:bg-red-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="6" r="4" />
            <path d="M3 6a5 5 0 0 0 10 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="12" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" />
            <line x1="5" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {t('startRecording')}
        </button>
      </div>
    </div>
  );
}
