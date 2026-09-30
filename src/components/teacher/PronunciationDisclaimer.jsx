import { useState } from 'react';

export const PRONUNCIATION_DISCLAIMER =
  "Accuracy, fluency, and prosody scores come from Microsoft Azure’s automated speech assessment " +
  "and are intended for formative feedback and tracking individual progress over time — not as a " +
  "clinical, diagnostic, or high-stakes measure. They were not validated as a speech-language pathology " +
  "instrument and should not replace standardized reading assessments (e.g., DIBELS) or be used for " +
  "grading, placement, or diagnosing speech/language disorders. If a score raises a concern, consult a " +
  "speech-language pathologist or your school’s standard literacy assessments.";

export default function PronunciationDisclaimer() {
  const [open, setOpen] = useState(false);

  return (
    <p className="mb-3 text-xs text-gray-400">
      Pronunciation scores are automated estimates.{' '}
      <button
        onClick={() => setOpen(o => !o)}
        className="text-blue-500 hover:text-blue-700 underline underline-offset-2"
      >
        {open ? 'Hide details' : 'Learn more'}
      </button>
      {open && (
        <span className="block mt-1 text-gray-500 leading-relaxed">
          {PRONUNCIATION_DISCLAIMER}
        </span>
      )}
    </p>
  );
}
