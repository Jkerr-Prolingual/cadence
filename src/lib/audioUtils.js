export function findCurrentWord(timestamps, time) {
  if (!timestamps?.length) return -1;
  let lo = 0, hi = timestamps.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (time < timestamps[mid].start) hi = mid - 1;
    else if (time > timestamps[mid].end) lo = mid + 1;
    else return mid;
  }
  return -1;
}

export function findCurrentSentence(sentences, time) {
  if (!sentences?.length) return -1;
  for (const s of sentences) {
    if (s.startTime != null && s.endTime != null) {
      if (time >= s.startTime - 0.1 && time <= s.endTime + 0.3) {
        return s.sentenceIdx;
      }
    }
  }
  return -1;
}

export function detectSentences(text, timestamps) {
  const sentences = [];
  const regex = /([a-zA-ZÀ-ÿ'''-]+)|([^a-zA-ZÀ-ÿ'''-]+)/g;
  let match;
  let wordIdx = 0;
  let sentenceStart = 0;
  let lastWordIdx = -1;
  let sentenceIdx = 0;

  // Build charIndex → timestamp lookup so sentence timing
  // matches correctly even when word counts differ
  const charToTimestamp = {};
  if (timestamps) {
    for (const ts of timestamps) {
      charToTimestamp[ts.charIndex] = ts;
    }
  }

  // Also build wordIdx → charIndex from text
  const wordCharIndices = [];
  const wordRegex = /[a-zA-ZÀ-ÿ'''-]+/g;
  let wm;
  while ((wm = wordRegex.exec(text)) !== null) {
    wordCharIndices.push(wm.index);
  }

  function getTimestampForWordIdx(wIdx) {
    const charIdx = wordCharIndices[wIdx];
    if (charIdx == null) return null;
    // Exact match first
    if (charToTimestamp[charIdx]) return charToTimestamp[charIdx];
    // Nearest timestamp within 3 characters (handles minor offset from punctuation)
    for (let d = 1; d <= 3; d++) {
      if (charToTimestamp[charIdx - d]) return charToTimestamp[charIdx - d];
      if (charToTimestamp[charIdx + d]) return charToTimestamp[charIdx + d];
    }
    return null;
  }

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      lastWordIdx = wordIdx;
      wordIdx++;
    } else if (/[.!?]/.test(match[2]) && lastWordIdx >= sentenceStart) {
      const s = { sentenceIdx, firstWordIdx: sentenceStart, lastWordIdx };
      if (timestamps) {
        const startTs = getTimestampForWordIdx(sentenceStart);
        const endTs = getTimestampForWordIdx(lastWordIdx);
        s.startTime = startTs?.start ?? 0;
        s.endTime = endTs?.end ?? 0;
      }
      sentences.push(s);
      sentenceIdx++;
      sentenceStart = wordIdx;
    }
  }

  if (lastWordIdx >= sentenceStart) {
    const s = { sentenceIdx, firstWordIdx: sentenceStart, lastWordIdx };
    if (timestamps) {
      const startTs = getTimestampForWordIdx(sentenceStart);
      const endTs = getTimestampForWordIdx(lastWordIdx);
      s.startTime = startTs?.start ?? 0;
      s.endTime = endTs?.end ?? 0;
    }
    sentences.push(s);
  }

  return sentences;
}

export function findSentenceForWord(sentences, wordIdx) {
  for (const s of sentences) {
    if (wordIdx >= s.firstWordIdx && wordIdx <= s.lastWordIdx) return s;
  }
  return null;
}

export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
