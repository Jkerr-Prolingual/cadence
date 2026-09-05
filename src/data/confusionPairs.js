// Minimal pair display data for phoneme confusions
// Keyed by "expected:alternate" matching aggregateConfusions() output
// Each entry provides human-readable word examples for non-IPA-literate users

export const confusionPairs = {
  // --- Vowels ---
  "ɪ:iː": { word1: "ship", word2: "sheep", highlight1: "i", highlight2: "ee" },
  "iː:ɪ": { word1: "sheep", word2: "ship", highlight1: "ee", highlight2: "i" },
  "ɛ:eɪ": { word1: "bed", word2: "bait", highlight1: "e", highlight2: "ai" },
  "eɪ:ɛ": { word1: "bait", word2: "bed", highlight1: "ai", highlight2: "e" },
  "æ:ɛ": { word1: "bat", word2: "bet", highlight1: "a", highlight2: "e" },
  "ɛ:æ": { word1: "bet", word2: "bat", highlight1: "e", highlight2: "a" },
  "ʌ:ɑː": { word1: "cup", word2: "cop", highlight1: "u", highlight2: "o" },
  "ɑː:ʌ": { word1: "cop", word2: "cup", highlight1: "o", highlight2: "u" },
  "ʊ:uː": { word1: "pull", word2: "pool", highlight1: "u", highlight2: "oo" },
  "uː:ʊ": { word1: "pool", word2: "pull", highlight1: "oo", highlight2: "u" },
  "æ:ʌ": { word1: "hat", word2: "hut", highlight1: "a", highlight2: "u" },
  "ʌ:æ": { word1: "hut", word2: "hat", highlight1: "u", highlight2: "a" },
  "ɑː:ɔː": { word1: "not", word2: "nought", highlight1: "o", highlight2: "ough" },
  "ɔː:ɑː": { word1: "nought", word2: "not", highlight1: "ough", highlight2: "o" },

  // --- Consonants: common L1 transfer confusions ---
  // es: /b/-/v/
  "b:v": { word1: "berry", word2: "very", highlight1: "b", highlight2: "v" },
  "v:b": { word1: "very", word2: "berry", highlight1: "v", highlight2: "b" },

  // ja/ko: /l/-/r/
  "l:r": { word1: "light", word2: "right", highlight1: "l", highlight2: "r" },
  "r:l": { word1: "right", word2: "light", highlight1: "r", highlight2: "l" },
  "l:ɹ": { word1: "light", word2: "right", highlight1: "l", highlight2: "r" },
  "ɹ:l": { word1: "right", word2: "light", highlight1: "r", highlight2: "l" },

  // es/zh/ja/ko: /θ/-/s/
  "θ:s": { word1: "think", word2: "sink", highlight1: "th", highlight2: "s" },
  "s:θ": { word1: "sink", word2: "think", highlight1: "s", highlight2: "th" },

  // es/zh/ja/ko: /ð/-/d/
  "ð:d": { word1: "then", word2: "den", highlight1: "th", highlight2: "d" },
  "d:ð": { word1: "den", word2: "then", highlight1: "d", highlight2: "th" },

  // ko: /p/-/f/
  "p:f": { word1: "pan", word2: "fan", highlight1: "p", highlight2: "f" },
  "f:p": { word1: "fan", word2: "pan", highlight1: "f", highlight2: "p" },

  // es: /dʒ/-/ʃ/
  "dʒ:ʃ": { word1: "joke", word2: "show", highlight1: "j", highlight2: "sh" },
  "ʃ:dʒ": { word1: "show", word2: "joke", highlight1: "sh", highlight2: "j" },

  // es: /j/-/dʒ/
  "j:dʒ": { word1: "yet", word2: "jet", highlight1: "y", highlight2: "j" },
  "dʒ:j": { word1: "jet", word2: "yet", highlight1: "j", highlight2: "y" },

  // es: /ʃ/-/tʃ/
  "ʃ:tʃ": { word1: "share", word2: "chair", highlight1: "sh", highlight2: "ch" },
  "tʃ:ʃ": { word1: "chair", word2: "share", highlight1: "ch", highlight2: "sh" },

  // zh: /l/-/n/
  "l:n": { word1: "light", word2: "night", highlight1: "l", highlight2: "n" },
  "n:l": { word1: "night", word2: "light", highlight1: "n", highlight2: "l" },

  // zh/ja: /v/-/w/
  "v:w": { word1: "vest", word2: "west", highlight1: "v", highlight2: "w" },
  "w:v": { word1: "west", word2: "vest", highlight1: "w", highlight2: "v" },

  // General: /s/-/z/
  "s:z": { word1: "sip", word2: "zip", highlight1: "s", highlight2: "z" },
  "z:s": { word1: "zip", word2: "sip", highlight1: "z", highlight2: "s" },

  // General: /f/-/v/
  "f:v": { word1: "fan", word2: "van", highlight1: "f", highlight2: "v" },
  "v:f": { word1: "van", word2: "fan", highlight1: "v", highlight2: "f" },

  // General: /t/-/d/
  "t:d": { word1: "ten", word2: "den", highlight1: "t", highlight2: "d" },
  "d:t": { word1: "den", word2: "ten", highlight1: "d", highlight2: "t" },

  // General: /p/-/b/
  "p:b": { word1: "pin", word2: "bin", highlight1: "p", highlight2: "b" },
  "b:p": { word1: "bin", word2: "pin", highlight1: "b", highlight2: "p" },

  // General: /k/-/g/
  "k:g": { word1: "cap", word2: "gap", highlight1: "c", highlight2: "g" },
  "g:k": { word1: "gap", word2: "cap", highlight1: "g", highlight2: "c" },
  "k:ɡ": { word1: "cap", word2: "gap", highlight1: "c", highlight2: "g" },
  "ɡ:k": { word1: "gap", word2: "cap", highlight1: "g", highlight2: "c" },
};

export function getConfusionDisplay(expected, alternate) {
  const pair = confusionPairs[`${expected}:${alternate}`];
  if (pair) return pair;
  return null;
}
