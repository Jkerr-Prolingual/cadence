// English IPA phoneme articulation data for pronunciation feedback
// ~44 entries: consonants, monophthong vowels, diphthongs
// Keys match Azure Speech PA output with PhonemeAlphabet: 'IPA'

export const ipaPhonemes = {
  // --- Stops ---
  "p": {
    type: "consonant", zone: "bilabial", tongue: "neutral", lips: "together",
    example: "pen", exampleHighlight: "p",
    instruction: "Press both lips together, then release with a puff of air.",
  },
  "b": {
    type: "consonant", zone: "bilabial", tongue: "neutral", lips: "together",
    example: "bed", exampleHighlight: "b",
    instruction: "Press both lips together, then release. Your throat vibrates.",
  },
  "t": {
    type: "consonant", zone: "alveolar", tongue: "tip-to-ridge", lips: "open",
    example: "top", exampleHighlight: "t",
    instruction: "Touch your tongue tip to the bump behind your upper teeth, then release.",
  },
  "d": {
    type: "consonant", zone: "alveolar", tongue: "tip-to-ridge", lips: "open",
    example: "dog", exampleHighlight: "d",
    instruction: "Touch your tongue tip to the bump behind your upper teeth, then release. Your throat vibrates.",
  },
  "k": {
    type: "consonant", zone: "velar", tongue: "back-raised", lips: "open",
    example: "cat", exampleHighlight: "c",
    instruction: "Raise the back of your tongue to touch your soft palate, then release.",
  },
  "ɡ": {
    type: "consonant", zone: "velar", tongue: "back-raised", lips: "open",
    example: "go", exampleHighlight: "g",
    instruction: "Raise the back of your tongue to touch your soft palate, then release. Your throat vibrates.",
  },
  "g": {
    type: "consonant", zone: "velar", tongue: "back-raised", lips: "open",
    example: "go", exampleHighlight: "g",
    instruction: "Raise the back of your tongue to touch your soft palate, then release. Your throat vibrates.",
  },

  // --- Fricatives ---
  "f": {
    type: "consonant", zone: "labiodental", tongue: "neutral", lips: "open",
    example: "fish", exampleHighlight: "f",
    instruction: "Gently bite your lower lip with your upper teeth and blow air through.",
  },
  "v": {
    type: "consonant", zone: "labiodental", tongue: "neutral", lips: "open",
    example: "very", exampleHighlight: "v",
    instruction: "Gently bite your lower lip with your upper teeth and blow air through. Your throat vibrates.",
  },
  "θ": {
    type: "consonant", zone: "dental", tongue: "tip-between-teeth", lips: "open",
    example: "think", exampleHighlight: "th",
    instruction: "Put your tongue tip between your teeth and blow air out gently.",
  },
  "ð": {
    type: "consonant", zone: "dental", tongue: "tip-between-teeth", lips: "open",
    example: "this", exampleHighlight: "th",
    instruction: "Put your tongue tip between your teeth and blow air. Your throat vibrates.",
  },
  "s": {
    type: "consonant", zone: "alveolar", tongue: "tip-near-ridge", lips: "spread",
    example: "sun", exampleHighlight: "s",
    instruction: "Put your tongue tip close to the bump behind your upper teeth. Blow air through the narrow gap.",
  },
  "z": {
    type: "consonant", zone: "alveolar", tongue: "tip-near-ridge", lips: "spread",
    example: "zoo", exampleHighlight: "z",
    instruction: "Same position as 's', but your throat vibrates.",
  },
  "ʃ": {
    type: "consonant", zone: "postalveolar", tongue: "blade-behind-ridge", lips: "rounded",
    example: "shoe", exampleHighlight: "sh",
    instruction: "Pull your tongue back slightly from the 's' position. Round your lips a little and blow air.",
  },
  "ʒ": {
    type: "consonant", zone: "postalveolar", tongue: "blade-behind-ridge", lips: "rounded",
    example: "measure", exampleHighlight: "s",
    instruction: "Same position as 'sh', but your throat vibrates. Like the 's' in 'measure'.",
  },
  "h": {
    type: "consonant", zone: "glottal", tongue: "neutral", lips: "open",
    example: "hat", exampleHighlight: "h",
    instruction: "Open your mouth and breathe out gently, like fogging a mirror.",
  },

  // --- Affricates ---
  "tʃ": {
    type: "consonant", zone: "postalveolar", tongue: "blade-behind-ridge", lips: "rounded",
    example: "church", exampleHighlight: "ch",
    instruction: "Start with your tongue in the 't' position, then slide into 'sh'. Like a sneeze: 'achoo'.",
  },
  "dʒ": {
    type: "consonant", zone: "postalveolar", tongue: "blade-behind-ridge", lips: "rounded",
    example: "jump", exampleHighlight: "j",
    instruction: "Start with your tongue in the 'd' position, then slide into the 'zh' sound. Your throat vibrates.",
  },

  // --- Nasals ---
  "m": {
    type: "consonant", zone: "bilabial", tongue: "neutral", lips: "together",
    example: "man", exampleHighlight: "m",
    instruction: "Press your lips together and hum. Air comes out through your nose.",
  },
  "n": {
    type: "consonant", zone: "alveolar", tongue: "tip-to-ridge", lips: "open",
    example: "no", exampleHighlight: "n",
    instruction: "Touch your tongue tip to the bump behind your upper teeth and hum. Air comes out your nose.",
  },
  "ŋ": {
    type: "consonant", zone: "velar", tongue: "back-raised", lips: "open",
    example: "sing", exampleHighlight: "ng",
    instruction: "Raise the back of your tongue to your soft palate and hum. Like the end of 'sing'.",
  },

  // --- Approximants ---
  "l": {
    type: "consonant", zone: "alveolar", tongue: "tip-to-ridge", lips: "open",
    example: "light", exampleHighlight: "l",
    instruction: "Touch your tongue tip to the bump behind your upper teeth. Air flows around the sides of your tongue.",
  },
  "ɹ": {
    type: "consonant", zone: "postalveolar", tongue: "tip-curled-back", lips: "rounded",
    example: "red", exampleHighlight: "r",
    instruction: "Curl your tongue tip back without touching anything. Round your lips slightly.",
  },
  "r": {
    type: "consonant", zone: "postalveolar", tongue: "tip-curled-back", lips: "rounded",
    example: "red", exampleHighlight: "r",
    instruction: "Curl your tongue tip back without touching anything. Round your lips slightly.",
  },
  "w": {
    type: "consonant", zone: "bilabial", tongue: "back-raised", lips: "rounded",
    example: "water", exampleHighlight: "w",
    instruction: "Round your lips tightly and raise the back of your tongue. Then release into the next sound.",
  },
  "j": {
    type: "consonant", zone: "palatal", tongue: "body-to-palate", lips: "spread",
    example: "yes", exampleHighlight: "y",
    instruction: "Raise the middle of your tongue toward the roof of your mouth, like you're starting to say 'ee'.",
  },

  // --- Monophthong vowels ---
  "iː": {
    type: "vowel", zone: null, tongue: "high-front", lips: "spread",
    example: "see", exampleHighlight: "ee",
    instruction: "Spread your lips wide like a smile. Tongue is high and forward.",
  },
  "i": {
    type: "vowel", zone: null, tongue: "high-front", lips: "spread",
    example: "see", exampleHighlight: "ee",
    instruction: "Spread your lips wide like a smile. Tongue is high and forward.",
  },
  "ɪ": {
    type: "vowel", zone: null, tongue: "high-front", lips: "spread",
    example: "sit", exampleHighlight: "i",
    instruction: "Relax your mouth slightly from 'ee'. Shorter and more relaxed.",
  },
  "ɛ": {
    type: "vowel", zone: null, tongue: "mid-front", lips: "spread",
    example: "bed", exampleHighlight: "e",
    instruction: "Open your mouth a little wider than for 'i'. Tongue is in the middle, toward the front.",
  },
  "e": {
    type: "vowel", zone: null, tongue: "mid-front", lips: "spread",
    example: "bed", exampleHighlight: "e",
    instruction: "Open your mouth a little wider than for 'i'. Tongue is in the middle, toward the front.",
  },
  "æ": {
    type: "vowel", zone: null, tongue: "low-front", lips: "spread",
    example: "cat", exampleHighlight: "a",
    instruction: "Open your mouth wide and push your tongue forward and down. Like a mix of 'ah' and 'eh'.",
  },
  "ɑ": {
    type: "vowel", zone: null, tongue: "low-back", lips: "open",
    example: "father", exampleHighlight: "a",
    instruction: "Open your mouth wide. Tongue is low and pulled back.",
  },
  "ɑː": {
    type: "vowel", zone: null, tongue: "low-back", lips: "open",
    example: "father", exampleHighlight: "a",
    instruction: "Open your mouth wide. Tongue is low and pulled back.",
  },
  "ɔ": {
    type: "vowel", zone: null, tongue: "low-back", lips: "rounded",
    example: "law", exampleHighlight: "aw",
    instruction: "Round your lips and open your mouth. Tongue is low and back.",
  },
  "ɔː": {
    type: "vowel", zone: null, tongue: "low-back", lips: "rounded",
    example: "law", exampleHighlight: "aw",
    instruction: "Round your lips and open your mouth. Tongue is low and back.",
  },
  "ʊ": {
    type: "vowel", zone: null, tongue: "high-back", lips: "rounded",
    example: "book", exampleHighlight: "oo",
    instruction: "Round your lips loosely. Tongue is high and pulled back. Short sound.",
  },
  "uː": {
    type: "vowel", zone: null, tongue: "high-back", lips: "rounded",
    example: "food", exampleHighlight: "oo",
    instruction: "Round your lips tightly. Tongue is high and pulled back. Long sound.",
  },
  "u": {
    type: "vowel", zone: null, tongue: "high-back", lips: "rounded",
    example: "food", exampleHighlight: "oo",
    instruction: "Round your lips tightly. Tongue is high and pulled back.",
  },
  "ʌ": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "cup", exampleHighlight: "u",
    instruction: "Relax your mouth. Tongue is in the center, slightly low. A quick 'uh' sound.",
  },
  "ɜː": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "bird", exampleHighlight: "ir",
    instruction: "Relax your mouth and say 'er'. Tongue floats in the center.",
  },
  "ɜ": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "bird", exampleHighlight: "ir",
    instruction: "Relax your mouth and say 'er'. Tongue floats in the center.",
  },
  "ə": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "about", exampleHighlight: "a",
    instruction: "The most relaxed vowel. Mouth barely open, tongue rests in the center. Like a lazy 'uh'.",
  },
  "ɝ": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "bird", exampleHighlight: "ir",
    instruction: "Say 'er' with your tongue curled back slightly. Common in American English.",
  },
  "ɚ": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "butter", exampleHighlight: "er",
    instruction: "A quick, unstressed 'er' sound. Tongue relaxed in the center with a slight curl.",
  },

  // --- Diphthongs ---
  "eɪ": {
    type: "diphthong", zone: null, tongue: "mid-front-to-high-front", lips: "spread",
    example: "day", exampleHighlight: "ay",
    instruction: "Start with mouth open saying 'eh', then glide up to 'ee'. Two sounds blended together.",
  },
  "aɪ": {
    type: "diphthong", zone: null, tongue: "low-central-to-high-front", lips: "open-to-spread",
    example: "time", exampleHighlight: "i",
    instruction: "Start with mouth wide open saying 'ah', then glide up to 'ee'.",
  },
  "ɔɪ": {
    type: "diphthong", zone: null, tongue: "low-back-to-high-front", lips: "rounded-to-spread",
    example: "boy", exampleHighlight: "oy",
    instruction: "Start with rounded lips saying 'aw', then glide to 'ee' while spreading your lips.",
  },
  "aʊ": {
    type: "diphthong", zone: null, tongue: "low-central-to-high-back", lips: "open-to-rounded",
    example: "now", exampleHighlight: "ow",
    instruction: "Start with mouth wide open saying 'ah', then glide to 'oo' while rounding your lips.",
  },
  "oʊ": {
    type: "diphthong", zone: null, tongue: "mid-back-to-high-back", lips: "rounded",
    example: "go", exampleHighlight: "o",
    instruction: "Start with slightly rounded lips saying 'oh', then glide to 'oo'.",
  },
};

export function lookupPhoneme(symbol) {
  return ipaPhonemes[symbol] || null;
}
