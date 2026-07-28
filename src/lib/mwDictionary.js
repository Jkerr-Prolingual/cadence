import { dbGet, dbPut } from './db';

const MW_API_KEY = import.meta.env.VITE_MW_LEARNERS_KEY;

function getAudioSubdir(filename) {
  if (filename.startsWith('bix')) return 'bix';
  if (filename.startsWith('gg')) return 'gg';
  if (/^[0-9_]/.test(filename)) return 'number';
  return filename[0];
}

function buildAudioUrl(filename) {
  const subdir = getAudioSubdir(filename);
  return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdir}/${filename}.mp3`;
}

export async function getMWAudioUrl(word) {
  if (!MW_API_KEY) return null;

  const key = word.toLowerCase().trim();

  const cached = await dbGet('enDefinitions', key).catch(() => null);
  if (cached?.audioUrl !== undefined) return cached.audioUrl;

  try {
    const res = await fetch(
      `https://dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(key)}?key=${MW_API_KEY}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || !data.length || typeof data[0] === 'string') {
      await dbPut('enDefinitions', { word: key, audioUrl: null }).catch(() => {});
      return null;
    }

    const entry = data[0];
    const audioFile = entry?.hwi?.prs?.[0]?.sound?.audio;
    const audioUrl = audioFile ? buildAudioUrl(audioFile) : null;

    await dbPut('enDefinitions', { word: key, audioUrl }).catch(() => {});
    return audioUrl;
  } catch {
    return null;
  }
}

let currentAudio = null;

export function playMWAudio(url) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentAudio = new Audio(url);
  currentAudio.play().catch(() => {});
}
