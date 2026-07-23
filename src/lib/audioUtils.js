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
      if (time >= s.startTime - 0.05 && time <= s.endTime + 0.05) {
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

export async function wavFromBlob(webmBlob) {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const sampleRate = 16000;
  const offlineCtx = new OfflineAudioContext(1, decoded.duration * sampleRate, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start();
  const rendered = await offlineCtx.startRendering();

  const pcm = rendered.getChannelData(0);
  const wavBuffer = encodeWAV(pcm, sampleRate);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function encodeWAV(samples, sampleRate) {
  const numSamples = samples.length;
  const dataBytes = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped * 0x7fff, true);
  }

  return buffer;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
