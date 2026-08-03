import { useState } from 'react';

export const PRONUNCIATION_DISCLAIMER =
  'Accuracy, fluency, and prosody scores come from Microsoft Azure’s automated speech assessment ' +
  'and are intended for formative feedback and tracking individual progress over time — not as a ' +
  'clinical, diagnostic, or high-stakes measure. They were not validated as a speech-language pathology ' +
  'instrument and should not replace standardized reading assessments (e.g., DIBELS) or be used for ' +
  'grading, placement, or diagnosing speech/language disorders. If a score raises a concern, consult a ' +
  'speech-language pathologist or your school’s standard literacy assessments.';

const STORAGE_KEY = 'relato_pronunciation_disclaimer_dismissed';

export default function PronunciationDisclaimer() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1'
  );

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
      <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800 mb-1">About Pronunciation Feedback Scores</p>
        <p className="text-xs text-blue-700 leading-relaxed">{PRONUNCIATION_DISCLAIMER}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-blue-400 hover:text-blue-600 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
