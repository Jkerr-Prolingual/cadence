const API_BASE = 'https://api.elevenlabs.io/v1';

export function getVoiceOptions() {
  const ids = (import.meta.env.VITE_ELEVENLABS_VOICE_IDS || '').split(',').filter(Boolean);
  const names = (import.meta.env.VITE_ELEVENLABS_VOICE_NAMES || '').split(',').filter(Boolean);
  return ids.map((id, i) => ({ id: id.trim(), name: (names[i] || `Voice ${i + 1}`).trim() }));
}

export async function generateAudio(text, voiceId, options = {}) {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('VITE_ELEVENLABS_API_KEY not configured');

  const {
    modelId = 'eleven_turbo_v2',
    stability = 0.5,
    similarityBoost = 0.75,
  } = options;

  const response = await fetch(`${API_BASE}/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} — ${error}`);
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

function charTimestampsToWordTimestamps(text, alignment) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;

  // Build words from the alignment's own character stream
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

  // Match alignment words to original text words using forward scan
  // ElevenLabs may drop or normalize characters (e.g., em dashes),
  // so word counts can differ. Match by normalized content, not index.
  const textWordRegex = /\S+/g;
  const textWords = [];
  let m;
  while ((m = textWordRegex.exec(text)) !== null) {
    textWords.push({ word: m[0], charIndex: m.index });
  }

  function normalize(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  const result = [];
  let textIdx = 0;
  for (const w of words) {
    const normW = normalize(w.word);
    if (!normW) continue;

    // Scan forward in text words to find a match
    let matched = null;
    for (let j = textIdx; j < textWords.length && j < textIdx + 3; j++) {
      if (normalize(textWords[j].word) === normW) {
        matched = textWords[j];
        textIdx = j + 1;
        break;
      }
    }

    // If no match found nearby, skip ahead to find it
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
      start: character_start_times_seconds[w.startIdx] ?? 0,
      end: character_end_times_seconds[w.endIdx] ?? (character_start_times_seconds[w.startIdx] ?? 0) + 0.1,
    });
  }

  return result;
}
