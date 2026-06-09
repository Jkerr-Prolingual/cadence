import { formatTime } from '../../lib/audioUtils';

const SPEEDS = [0.5, 0.75, 1.0, 1.25];

export default function ListenReadStrip({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onPlayPause,
  onSeek,
  onSpeedChange,
}) {
  return (
    <div className="border-t border-gray-200 bg-white px-4 py-2 sm:py-3">
      <div className="max-w-2xl mx-auto space-y-2">
        {/* Row 1: Play + Scrubber */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onPlayPause}
            className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 transition-colors flex-shrink-0"
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
        </div>

        {/* Row 2: Speed */}
        <div className="flex items-center">
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
        </div>
      </div>
    </div>
  );
}
