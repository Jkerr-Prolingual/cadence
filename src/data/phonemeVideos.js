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

  ja: {
    videoId: 'Qe3EmiFWgGM',
    title: '【永久保存版】たった30分で発音記号を完全攻略【速習まとめ】',
    channel: 'Atsueigo',
    phonemes: {
      // Vowels
      'æ':  { start: ts(1, 6),  end: ts(1, 47) },
      'ɑ':  { start: ts(1, 47), end: ts(2, 15) },
      'ɑː': { start: ts(1, 47), end: ts(2, 15) },
      'ɔ':  { start: ts(2, 15), end: ts(2, 51) },
      'ɔː': { start: ts(2, 15), end: ts(2, 51) },
      'ə':  { start: ts(2, 51), end: ts(3, 40) },
      'ʌ':  { start: ts(3, 40), end: ts(4, 11) },
      'ɝ':  { start: ts(4, 11), end: ts(5, 2) },
      'ɜː': { start: ts(4, 11), end: ts(5, 2) },
      'ɜ':  { start: ts(4, 11), end: ts(5, 2) },
      'ɚ':  { start: ts(4, 11), end: ts(5, 2) },
      'ɪ':  { start: ts(5, 2),  end: ts(5, 47) },
      'i':  { start: ts(5, 47), end: ts(6, 21) },
      'iː': { start: ts(5, 47), end: ts(6, 21) },
      'ʊ':  { start: ts(6, 21), end: ts(7, 7) },
      'u':  { start: ts(7, 7),  end: ts(7, 42) },
      'uː': { start: ts(7, 7),  end: ts(7, 42) },
      'ɛ':  { start: ts(7, 42), end: ts(8, 21) },
      'e':  { start: ts(7, 42), end: ts(8, 21) },

      // Diphthongs
      'aɪ': { start: ts(8, 21), end: ts(9, 2) },
      'aʊ': { start: ts(9, 2),  end: ts(9, 18) },
      'eɪ': { start: ts(9, 18), end: ts(9, 56) },
      'ɔɪ': { start: ts(9, 56), end: ts(10, 12) },
      'oʊ': { start: ts(10, 12), end: ts(11, 44) },

      // Consonants (video groups voiced/voiceless pairs)
      'p':  { start: ts(11, 44), end: ts(13, 1) },
      'b':  { start: ts(11, 44), end: ts(13, 1) },
      't':  { start: ts(13, 1),  end: ts(13, 56) },
      'd':  { start: ts(13, 1),  end: ts(13, 56) },
      'k':  { start: ts(13, 56), end: ts(14, 38) },
      'g':  { start: ts(13, 56), end: ts(14, 38) },
      'ɡ':  { start: ts(13, 56), end: ts(14, 38) },
      'f':  { start: ts(14, 38), end: ts(16, 2) },
      'v':  { start: ts(14, 38), end: ts(16, 2) },
      'θ':  { start: ts(16, 2),  end: ts(17, 33) },
      'ð':  { start: ts(16, 2),  end: ts(17, 33) },
      's':  { start: ts(17, 33), end: ts(18, 12) },
      'z':  { start: ts(17, 33), end: ts(18, 12) },
      'ʃ':  { start: ts(18, 12), end: ts(19, 24) },
      'ʒ':  { start: ts(18, 12), end: ts(19, 24) },
      'tʃ': { start: ts(19, 24), end: ts(20, 40) },
      'dʒ': { start: ts(19, 24), end: ts(20, 40) },
      'l':  { start: ts(20, 40), end: ts(23, 6) },
      'r':  { start: ts(23, 6),  end: ts(24, 25) },
      'ɹ':  { start: ts(23, 6),  end: ts(24, 25) },
      'm':  { start: ts(24, 25), end: ts(25, 1) },
      'n':  { start: ts(25, 1),  end: ts(25, 39) },
      'ŋ':  { start: ts(25, 39), end: ts(27, 2) },
      'h':  { start: ts(27, 2),  end: ts(27, 34) },
      'j':  { start: ts(27, 34), end: ts(28, 32) },
      'w':  { start: ts(28, 32), end: ts(29, 30) },
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
