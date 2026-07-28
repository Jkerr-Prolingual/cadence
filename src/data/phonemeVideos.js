// YouTube video timestamps for phoneme pronunciation instruction, keyed by L1.
// Each L1 maps to a video + per-phoneme start/end times (seconds).
// Videos are curated per L1 — they teach English sounds that don't exist
// in the learner's native language, explained IN the native language.

function ts(min, sec) {
  return min * 60 + sec;
}

export const phonemeVideos = {
  es: {
    videoId: '_Aunm4ycuxE',
    title: 'Domina los sonidos MÁS IMPORTANTES del inglés en MINUTOS',
    channel: 'Gringlés Fácil with Connor',
    phonemes: {
      // Consonants (11 sounds not in Spanish)
      'θ':  { start: ts(2, 15), end: ts(3, 7) },
      'ð':  { start: ts(3, 7),  end: ts(4, 23) },
      'ʃ':  { start: ts(4, 23), end: ts(5, 27) },
      'ʒ':  { start: ts(5, 27), end: ts(6, 27) },
      'tʃ': { start: ts(6, 27), end: ts(9, 11) },
      'dʒ': { start: ts(9, 11), end: ts(10, 44) },
      'r':  { start: ts(10, 44), end: ts(11, 18) },
      'ɹ':  { start: ts(10, 44), end: ts(11, 18) },
      'ŋ':  { start: ts(11, 14), end: ts(12, 5) },
      'h':  { start: ts(12, 0),  end: ts(12, 50) },
      'v':  { start: ts(12, 46), end: ts(13, 24) },
      'z':  { start: ts(13, 24), end: ts(13, 47) },

      // Vowels (10 sounds not in Spanish)
      'ɪ':  { start: ts(15, 43), end: ts(16, 17) },
      'iː': { start: ts(16, 17), end: ts(16, 49) },
      'i':  { start: ts(16, 17), end: ts(16, 49) },
      'ʊ':  { start: ts(16, 49), end: ts(17, 49) },
      'uː': { start: ts(17, 46), end: ts(18, 20) },
      'u':  { start: ts(17, 46), end: ts(18, 20) },
      'æ':  { start: ts(18, 18), end: ts(19, 28) },
      'ʌ':  { start: ts(19, 27), end: ts(20, 3) },
      'ɜː': { start: ts(20, 0),  end: ts(20, 45) },
      'ɜ':  { start: ts(20, 0),  end: ts(20, 45) },
      'ɝ':  { start: ts(20, 0),  end: ts(20, 45) },
      'ɑː': { start: ts(20, 45), end: ts(21, 22) },
      'ɑ':  { start: ts(20, 45), end: ts(21, 22) },
      'ɔː': { start: ts(21, 18), end: ts(23, 4) },
      'ɔ':  { start: ts(21, 18), end: ts(23, 4) },
      'ə':  { start: ts(23, 1),  end: ts(24, 35) },
      'ɚ':  { start: ts(23, 1),  end: ts(24, 35) },
    },
  },
};

export function getPhonemeVideo(l1, phonemeSymbol) {
  const lang = phonemeVideos[l1];
  if (!lang) return null;
  const clip = lang.phonemes[phonemeSymbol];
  if (!clip) return null;
  return { videoId: lang.videoId, ...clip };
}
