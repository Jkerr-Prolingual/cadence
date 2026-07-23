import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ChapterProgressPanel({ chapterProgress }) {
  const navigate = useNavigate();
  const { fluency, recording, srs, assignments } = chapterProgress;
  const [audioUrl, setAudioUrl] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef(null);

  const { exists: hasRecording, storagePath } = recording;
  useEffect(() => {
    if (!hasRecording || !storagePath) return;
    let cancelled = false;
    setLoadingAudio(true);
    supabase.storage
      .from('student-recordings')
      .createSignedUrl(storagePath, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setAudioUrl(data.signedUrl);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingAudio(false); });
    return () => { cancelled = true; };
  }, [hasRecording, storagePath]);

  const hasAny = fluency.sessionCount > 0 || recording.exists || srs.totalCards > 0 || assignments;
  if (!hasAny) return null;

  return (
    <div className="border border-t-0 border-gray-200 rounded-b-lg bg-gray-50 px-4 py-3 -mt-1 space-y-3">
      {/* Timed reads */}
      {fluency.sessionCount > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Timed reads
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {fluency.wpmHistory.join(' → ')} WPM
            </span>
            <span className="text-xs text-gray-400">
              ({fluency.sessionCount} {fluency.sessionCount === 1 ? 'pass' : 'passes'})
            </span>
          </div>
        </div>
      )}

      {/* Recording */}
      {recording.exists && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Your recording
          </p>
          <div className="flex items-center gap-3">
            {loadingAudio ? (
              <span className="text-xs text-gray-400">Loading audio...</span>
            ) : audioUrl ? (
              <audio ref={audioRef} src={audioUrl} controls preload="none"
                className="h-8 w-full max-w-xs" />
            ) : (
              <span className="text-xs text-gray-400">Audio unavailable</span>
            )}
            {recording.durationSeconds > 0 && (
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatDuration(recording.durationSeconds)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Flashcards */}
      {srs.totalCards > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Flashcards
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              {srs.totalCards} {srs.totalCards === 1 ? 'card' : 'cards'}
              {srs.dueCards > 0 && (
                <span className="text-amber-600 ml-1 font-medium">
                  ({srs.dueCards} due)
                </span>
              )}
            </span>
            <button
              onClick={() => navigate('/flashcards')}
              className="text-xs px-2.5 py-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Practice
            </button>
          </div>
        </div>
      )}

      {/* Assignments */}
      {assignments && assignments.total > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Assignment
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {assignments.completed}/{assignments.total} tasks
            </span>
            {assignments.completed === assignments.total && (
              <span className="text-green-600 text-xs font-medium">✓ Complete</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
