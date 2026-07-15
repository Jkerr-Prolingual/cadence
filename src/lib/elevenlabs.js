import { supabase } from './supabase.js';

export function getVoiceOptions() {
  const ids = (import.meta.env.VITE_ELEVENLABS_VOICE_IDS || '').split(',').filter(Boolean);
  const names = (import.meta.env.VITE_ELEVENLABS_VOICE_NAMES || '').split(',').filter(Boolean);
  return ids.map((id, i) => ({ id: id.trim(), name: (names[i] || `Voice ${i + 1}`).trim() }));
}

export async function submitAudioJob(text, voiceId, textId, options = {}) {
  const {
    modelId = 'eleven_turbo_v2',
    stability = 0.5,
    similarityBoost = 0.75,
    speed = 0.92,
  } = options;

  const { data: job, error: insertError } = await supabase
    .from('audio_jobs')
    .insert({ text_id: textId, status: 'pending' })
    .select('id')
    .single();
  if (insertError) throw new Error(`Failed to create job: ${insertError.message}`);

  const response = await fetch('/.netlify/functions/generate-audio-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: job.id,
      text,
      voiceId,
      textId,
      modelId,
      stability,
      similarityBoost,
      speed,
    }),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`Failed to submit audio job: HTTP ${response.status}`);
  }

  return job.id;
}

export async function pollAudioJob(jobId, { intervalMs = 3000, timeoutMs = 300000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { data, error } = await supabase
      .from('audio_jobs')
      .select('status, error_message, alignment, audio_path')
      .eq('id', jobId)
      .single();

    if (error) throw new Error(`Failed to check job status: ${error.message}`);

    if (data.status === 'complete') return data;
    if (data.status === 'error') throw new Error(data.error_message || 'Audio generation failed');

    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Audio generation timed out');
}

export function processAudioResult(text, alignment, audioBlob) {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audioTimestamps = charTimestampsToWordTimestamps(text, alignment);
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
