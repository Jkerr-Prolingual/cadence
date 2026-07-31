export function getVoiceOptions() {
  const ids = (import.meta.env.VITE_ELEVENLABS_VOICE_IDS || '').split(',').filter(Boolean);
  const names = (import.meta.env.VITE_ELEVENLABS_VOICE_NAMES || '').split(',').filter(Boolean);
  return ids.map((id, i) => ({ id: id.trim(), name: (names[i] || `Voice ${i + 1}`).trim() }));
}

let cachedKey = null;

async function getApiKey() {
  if (cachedKey) return cachedKey;
  const res = await fetch('/.netlify/functions/elevenlabs-key');
  if (!res.ok) throw new Error('Failed to fetch ElevenLabs API key');
  const { key } = await res.json();
  cachedKey = key;
  return key;
}

export async function generateAudio(text, voiceId, options = {}) {
  const {
    modelId = 'eleven_turbo_v2',
    stability = 0.5,
    similarityBoost = 0.75,
    speed = 0.92,
  } = options;

  const apiKey = await getApiKey();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability, similarity_boost: similarityBoost, speed },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} — ${errorText}`);
  }

  const data = await response.json();

  const audioBytes = atob(data.audio_base64);
  const audioBuffer = new Uint8Array(audioBytes.length);
  for (let i = 0; i < audioBytes.length; i++) {
    audioBuffer[i] = audioBytes.charCodeAt(i);
  }
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audioTimestamps = charTimestampsToWordTimestamps(text, data.alignment);

  return { audioUrl, audioBlob, audioTimestamps };
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractTextWords(text) {
  const regex = /\S+/g;
  const words = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    words.push({ word: m[0], charIndex: m.index });
  }
  return words;
}

function matchWordsToText(sourceWords, textWords, getTimestamp) {
  const result = [];
  let textIdx = 0;
  for (const w of sourceWords) {
    const normW = normalize(w.word);
    if (!normW) continue;

    let matched = null;
    for (let j = textIdx; j < textWords.length && j < textIdx + 3; j++) {
      if (normalize(textWords[j].word) === normW) {
        matched = textWords[j];
        textIdx = j + 1;
        break;
      }
    }

    if (!matched) {
      for (let j = textIdx; j < textWords.length; j++) {
        if (normalize(textWords[j].word) === normW) {
          matched = textWords[j];
          textIdx = j + 1;
          break;
        }
      }
    }

    result.push({
      word: matched?.word ?? w.word,
      charIndex: matched?.charIndex ?? 0,
      ...getTimestamp(w),
    });
  }
  return result;
}

export function whisperTimestampsToWordTimestamps(text, whisperWords) {
  const textWords = extractTextWords(text);
  return matchWordsToText(whisperWords, textWords, w => ({ start: w.start, end: w.end }));
}

function charTimestampsToWordTimestamps(text, alignment) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;

  const words = [];
  let currentWord = '';
  let wordStartIdx = -1;

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    if (ch.trim() === '') {
      if (currentWord) {
        words.push({ word: currentWord, startIdx: wordStartIdx, endIdx: i - 1 });
        currentWord = '';
        wordStartIdx = -1;
      }
    } else {
      if (!currentWord) wordStartIdx = i;
      currentWord += ch;
    }
  }
  if (currentWord) {
    words.push({ word: currentWord, startIdx: wordStartIdx, endIdx: characters.length - 1 });
  }

  const textWords = extractTextWords(text);
  return matchWordsToText(words, textWords, w => ({
    start: character_start_times_seconds[w.startIdx] ?? 0,
    end: character_end_times_seconds[w.endIdx] ?? (character_start_times_seconds[w.startIdx] ?? 0) + 0.1,
  }));
}
