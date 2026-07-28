// English IPA phoneme articulation data for pronunciation feedback
// ~44 entries: consonants, monophthong vowels, diphthongs
// Keys match Azure Speech PA output with PhonemeAlphabet: 'IPA'
// `instruction` is the English default; `instructions` has locale-keyed overrides.

export const ipaPhonemes = {
  // --- Stops ---
  "p": {
    type: "consonant", zone: "bilabial", tongue: "neutral", lips: "together",
    example: "pen", exampleHighlight: "p",
    instruction: "Press both lips together, then release with a puff of air.",
    instructions: { es: "Junta los labios y suéltalos con un soplo de aire." },
  },
  "b": {
    type: "consonant", zone: "bilabial", tongue: "neutral", lips: "together",
    example: "bed", exampleHighlight: "b",
    instruction: "Press both lips together, then release. Your throat vibrates.",
    instructions: { es: "Junta los labios y suéltalos. Tu garganta vibra." },
  },
  "t": {
    type: "consonant", zone: "alveolar", tongue: "tip-to-ridge", lips: "open",
    example: "top", exampleHighlight: "t",
    instruction: "Touch your tongue tip to the bump behind your upper teeth, then release.",
    instructions: { es: "Toca la punta de la lengua en la cresta detrás de los dientes superiores y suéltala." },
  },
  "d": {
    type: "consonant", zone: "alveolar", tongue: "tip-to-ridge", lips: "open",
    example: "dog", exampleHighlight: "d",
    instruction: "Touch your tongue tip to the bump behind your upper teeth, then release. Your throat vibrates.",
    instructions: { es: "Toca la punta de la lengua en la cresta detrás de los dientes superiores y suéltala. Tu garganta vibra." },
  },
  "k": {
    type: "consonant", zone: "velar", tongue: "back-raised", lips: "open",
    example: "cat", exampleHighlight: "c",
    instruction: "Raise the back of your tongue to touch your soft palate, then release.",
    instructions: { es: "Levanta la parte trasera de la lengua hasta tocar el paladar blando y suéltala." },
  },
  "ɡ": {
    type: "consonant", zone: "velar", tongue: "back-raised", lips: "open",
    example: "go", exampleHighlight: "g",
    instruction: "Raise the back of your tongue to touch your soft palate, then release. Your throat vibrates.",
    instructions: { es: "Levanta la parte trasera de la lengua hasta el paladar blando y suéltala. Tu garganta vibra." },
  },
  "g": {
    type: "consonant", zone: "velar", tongue: "back-raised", lips: "open",
    example: "go", exampleHighlight: "g",
    instruction: "Raise the back of your tongue to touch your soft palate, then release. Your throat vibrates.",
    instructions: { es: "Levanta la parte trasera de la lengua hasta el paladar blando y suéltala. Tu garganta vibra." },
  },

  // --- Fricatives ---
  "f": {
    type: "consonant", zone: "labiodental", tongue: "neutral", lips: "open",
    example: "fish", exampleHighlight: "f",
    instruction: "Gently bite your lower lip with your upper teeth and blow air through.",
    instructions: { es: "Muerde suavemente el labio inferior con los dientes superiores y sopla aire." },
  },
  "v": {
    type: "consonant", zone: "labiodental", tongue: "neutral", lips: "open",
    example: "very", exampleHighlight: "v",
    instruction: "Gently bite your lower lip with your upper teeth and blow air through. Your throat vibrates.",
    instructions: { es: "Muerde suavemente el labio inferior con los dientes superiores y sopla aire. Tu garganta vibra. No es igual a la 'b' en español." },
  },
  "θ": {
    type: "consonant", zone: "dental", tongue: "tip-between-teeth", lips: "open",
    example: "think", exampleHighlight: "th",
    instruction: "Put your tongue tip between your teeth and blow air out gently.",
    instructions: { es: "Pon la punta de la lengua entre los dientes y sopla aire suavemente. Como la 'z' de España." },
  },
  "ð": {
    type: "consonant", zone: "dental", tongue: "tip-between-teeth", lips: "open",
    example: "this", exampleHighlight: "th",
    instruction: "Put your tongue tip between your teeth and blow air. Your throat vibrates.",
    instructions: { es: "Pon la punta de la lengua entre los dientes y sopla aire. Tu garganta vibra. Como la 'd' suave en 'nada'." },
  },
  "s": {
    type: "consonant", zone: "alveolar", tongue: "tip-near-ridge", lips: "spread",
    example: "sun", exampleHighlight: "s",
    instruction: "Put your tongue tip close to the bump behind your upper teeth. Blow air through the narrow gap.",
    instructions: { es: "Pon la punta de la lengua cerca de la cresta detrás de los dientes superiores. Sopla aire por el espacio estrecho." },
  },
  "z": {
    type: "consonant", zone: "alveolar", tongue: "tip-near-ridge", lips: "spread",
    example: "zoo", exampleHighlight: "z",
    instruction: "Same position as 's', but your throat vibrates.",
    instructions: { es: "Misma posición que la 's', pero tu garganta vibra. Este sonido no existe en español." },
  },
  "ʃ": {
    type: "consonant", zone: "postalveolar", tongue: "blade-behind-ridge", lips: "rounded",
    example: "shoe", exampleHighlight: "sh",
    instruction: "Pull your tongue back slightly from the 's' position. Round your lips a little and blow air.",
    instructions: { es: "Lleva la lengua un poco más atrás que la 's'. Redondea los labios un poco y sopla aire. Como cuando dices '¡shhh!'." },
  },
  "ʒ": {
    type: "consonant", zone: "postalveolar", tongue: "blade-behind-ridge", lips: "rounded",
    example: "measure", exampleHighlight: "s",
    instruction: "Same position as 'sh', but your throat vibrates. Like the 's' in 'measure'.",
    instructions: { es: "Misma posición que 'sh', pero tu garganta vibra. Como la 'y' argentina o la 'j' en francés." },
  },
  "h": {
    type: "consonant", zone: "glottal", tongue: "neutral", lips: "open",
    example: "hat", exampleHighlight: "h",
    instruction: "Open your mouth and breathe out gently, like fogging a mirror.",
    instructions: { es: "Abre la boca y exhala suavemente, como si empañaras un espejo. Más suave que la 'j' española." },
  },

  // --- Affricates ---
  "tʃ": {
    type: "consonant", zone: "postalveolar", tongue: "blade-behind-ridge", lips: "rounded",
    example: "church", exampleHighlight: "ch",
    instruction: "Start with your tongue in the 't' position, then slide into 'sh'. Like a sneeze: 'achoo'.",
    instructions: { es: "Empieza con la lengua en posición de 't' y deslízala hacia 'sh'. Similar a la 'ch' en español pero con más aire." },
  },
  "dʒ": {
    type: "consonant", zone: "postalveolar", tongue: "blade-behind-ridge", lips: "rounded",
    example: "jump", exampleHighlight: "j",
    instruction: "Start with your tongue in the 'd' position, then slide into the 'zh' sound. Your throat vibrates.",
    instructions: { es: "Empieza con la lengua en posición de 'd' y deslízala hacia el sonido 'zh'. Tu garganta vibra. Este sonido no existe en español." },
  },

  // --- Nasals ---
  "m": {
    type: "consonant", zone: "bilabial", tongue: "neutral", lips: "together",
    example: "man", exampleHighlight: "m",
    instruction: "Press your lips together and hum. Air comes out through your nose.",
    instructions: { es: "Junta los labios y tararea. El aire sale por la nariz." },
  },
  "n": {
    type: "consonant", zone: "alveolar", tongue: "tip-to-ridge", lips: "open",
    example: "no", exampleHighlight: "n",
    instruction: "Touch your tongue tip to the bump behind your upper teeth and hum. Air comes out your nose.",
    instructions: { es: "Toca la punta de la lengua en la cresta detrás de los dientes superiores y tararea. El aire sale por la nariz." },
  },
  "ŋ": {
    type: "consonant", zone: "velar", tongue: "back-raised", lips: "open",
    example: "sing", exampleHighlight: "ng",
    instruction: "Raise the back of your tongue to your soft palate and hum. Like the end of 'sing'.",
    instructions: { es: "Levanta la parte trasera de la lengua al paladar blando y tararea. No digas la 'g' al final — solo el sonido nasal." },
  },

  // --- Approximants ---
  "l": {
    type: "consonant", zone: "alveolar", tongue: "tip-to-ridge", lips: "open",
    example: "light", exampleHighlight: "l",
    instruction: "Touch your tongue tip to the bump behind your upper teeth. Air flows around the sides of your tongue.",
    instructions: { es: "Toca la punta de la lengua en la cresta detrás de los dientes superiores. El aire pasa por los lados de la lengua." },
  },
  "ɹ": {
    type: "consonant", zone: "postalveolar", tongue: "tip-curled-back", lips: "rounded",
    example: "red", exampleHighlight: "r",
    instruction: "Curl your tongue tip back without touching anything. Round your lips slightly.",
    instructions: { es: "Enrolla la punta de la lengua hacia atrás sin tocar nada. Redondea los labios un poco. No vibra como la 'r' española." },
  },
  "r": {
    type: "consonant", zone: "postalveolar", tongue: "tip-curled-back", lips: "rounded",
    example: "red", exampleHighlight: "r",
    instruction: "Curl your tongue tip back without touching anything. Round your lips slightly.",
    instructions: { es: "Enrolla la punta de la lengua hacia atrás sin tocar nada. Redondea los labios un poco. No vibra como la 'r' española." },
  },
  "w": {
    type: "consonant", zone: "bilabial", tongue: "back-raised", lips: "rounded",
    example: "water", exampleHighlight: "w",
    instruction: "Round your lips tightly and raise the back of your tongue. Then release into the next sound.",
    instructions: { es: "Redondea los labios como para decir 'u' y levanta la parte trasera de la lengua. Luego suelta hacia el siguiente sonido." },
  },
  "j": {
    type: "consonant", zone: "palatal", tongue: "body-to-palate", lips: "spread",
    example: "yes", exampleHighlight: "y",
    instruction: "Raise the middle of your tongue toward the roof of your mouth, like you're starting to say 'ee'.",
    instructions: { es: "Levanta la parte media de la lengua hacia el paladar, como si fueras a decir 'i'." },
  },

  // --- Monophthong vowels ---
  "iː": {
    type: "vowel", zone: null, tongue: "high-front", lips: "spread",
    example: "see", exampleHighlight: "ee",
    instruction: "Spread your lips wide like a smile. Tongue is high and forward.",
    instructions: { es: "Abre los labios como una sonrisa. La lengua está alta y adelante. Más largo que la 'i' en español." },
  },
  "i": {
    type: "vowel", zone: null, tongue: "high-front", lips: "spread",
    example: "see", exampleHighlight: "ee",
    instruction: "Spread your lips wide like a smile. Tongue is high and forward.",
    instructions: { es: "Abre los labios como una sonrisa. La lengua está alta y adelante." },
  },
  "ɪ": {
    type: "vowel", zone: null, tongue: "high-front", lips: "spread",
    example: "sit", exampleHighlight: "i",
    instruction: "Relax your mouth slightly from 'ee'. Shorter and more relaxed.",
    instructions: { es: "Relaja la boca un poco desde la 'i' larga. Más corta y relajada. No existe en español." },
  },
  "ɛ": {
    type: "vowel", zone: null, tongue: "mid-front", lips: "spread",
    example: "bed", exampleHighlight: "e",
    instruction: "Open your mouth a little wider than for 'i'. Tongue is in the middle, toward the front.",
    instructions: { es: "Abre la boca un poco más que para la 'i'. La lengua está en el medio, hacia adelante." },
  },
  "e": {
    type: "vowel", zone: null, tongue: "mid-front", lips: "spread",
    example: "bed", exampleHighlight: "e",
    instruction: "Open your mouth a little wider than for 'i'. Tongue is in the middle, toward the front.",
    instructions: { es: "Abre la boca un poco más que para la 'i'. La lengua está en el medio, hacia adelante." },
  },
  "æ": {
    type: "vowel", zone: null, tongue: "low-front", lips: "spread",
    example: "cat", exampleHighlight: "a",
    instruction: "Open your mouth wide and push your tongue forward and down. Like a mix of 'ah' and 'eh'.",
    instructions: { es: "Abre la boca bien y empuja la lengua hacia adelante y abajo. Como una mezcla entre 'a' y 'e'. No existe en español." },
  },
  "ɑ": {
    type: "vowel", zone: null, tongue: "low-back", lips: "open",
    example: "father", exampleHighlight: "a",
    instruction: "Open your mouth wide. Tongue is low and pulled back.",
    instructions: { es: "Abre la boca bien. La lengua está baja y hacia atrás." },
  },
  "ɑː": {
    type: "vowel", zone: null, tongue: "low-back", lips: "open",
    example: "father", exampleHighlight: "a",
    instruction: "Open your mouth wide. Tongue is low and pulled back.",
    instructions: { es: "Abre la boca bien. La lengua está baja y hacia atrás. Sonido largo." },
  },
  "ɔ": {
    type: "vowel", zone: null, tongue: "low-back", lips: "rounded",
    example: "law", exampleHighlight: "aw",
    instruction: "Round your lips and open your mouth. Tongue is low and back.",
    instructions: { es: "Redondea los labios y abre la boca. La lengua está baja y atrás. No existe en español." },
  },
  "ɔː": {
    type: "vowel", zone: null, tongue: "low-back", lips: "rounded",
    example: "law", exampleHighlight: "aw",
    instruction: "Round your lips and open your mouth. Tongue is low and back.",
    instructions: { es: "Redondea los labios y abre la boca. La lengua está baja y atrás. No existe en español." },
  },
  "ʊ": {
    type: "vowel", zone: null, tongue: "high-back", lips: "rounded",
    example: "book", exampleHighlight: "oo",
    instruction: "Round your lips loosely. Tongue is high and pulled back. Short sound.",
    instructions: { es: "Redondea los labios sin apretar. La lengua está alta y atrás. Sonido corto. No existe en español." },
  },
  "uː": {
    type: "vowel", zone: null, tongue: "high-back", lips: "rounded",
    example: "food", exampleHighlight: "oo",
    instruction: "Round your lips tightly. Tongue is high and pulled back. Long sound.",
    instructions: { es: "Redondea los labios bien. La lengua está alta y atrás. Más largo que la 'u' en español." },
  },
  "u": {
    type: "vowel", zone: null, tongue: "high-back", lips: "rounded",
    example: "food", exampleHighlight: "oo",
    instruction: "Round your lips tightly. Tongue is high and pulled back.",
    instructions: { es: "Redondea los labios bien. La lengua está alta y atrás." },
  },
  "ʌ": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "cup", exampleHighlight: "u",
    instruction: "Relax your mouth. Tongue is in the center, slightly low. A quick 'uh' sound.",
    instructions: { es: "Relaja la boca. La lengua está en el centro, un poco baja. Un sonido rápido de 'a'. No existe en español." },
  },
  "ɜː": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "bird", exampleHighlight: "ir",
    instruction: "Relax your mouth and say 'er'. Tongue floats in the center.",
    instructions: { es: "Relaja la boca y di 'er'. La lengua flota en el centro. No existe en español." },
  },
  "ɜ": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "bird", exampleHighlight: "ir",
    instruction: "Relax your mouth and say 'er'. Tongue floats in the center.",
    instructions: { es: "Relaja la boca y di 'er'. La lengua flota en el centro. No existe en español." },
  },
  "ə": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "about", exampleHighlight: "a",
    instruction: "The most relaxed vowel. Mouth barely open, tongue rests in the center. Like a lazy 'uh'.",
    instructions: { es: "La vocal más relajada. La boca apenas abierta, la lengua descansa en el centro. Como un 'a' muy relajado y corto. No existe en español." },
  },
  "ɝ": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "bird", exampleHighlight: "ir",
    instruction: "Say 'er' with your tongue curled back slightly. Common in American English.",
    instructions: { es: "Di 'er' con la lengua enrollada ligeramente hacia atrás. Común en inglés americano." },
  },
  "ɚ": {
    type: "vowel", zone: null, tongue: "mid-central", lips: "open",
    example: "butter", exampleHighlight: "er",
    instruction: "A quick, unstressed 'er' sound. Tongue relaxed in the center with a slight curl.",
    instructions: { es: "Un sonido rápido de 'er' sin acento. La lengua relajada en el centro con un ligero enrollamiento." },
  },

  // --- Diphthongs ---
  "eɪ": {
    type: "diphthong", zone: null, tongue: "mid-front-to-high-front", lips: "spread",
    example: "day", exampleHighlight: "ay",
    instruction: "Start with mouth open saying 'eh', then glide up to 'ee'. Two sounds blended together.",
    instructions: { es: "Empieza con la boca abierta diciendo 'e' y desliza hacia 'i'. Dos sonidos mezclados." },
  },
  "aɪ": {
    type: "diphthong", zone: null, tongue: "low-central-to-high-front", lips: "open-to-spread",
    example: "time", exampleHighlight: "i",
    instruction: "Start with mouth wide open saying 'ah', then glide up to 'ee'.",
    instructions: { es: "Empieza con la boca bien abierta diciendo 'a' y desliza hacia 'i'." },
  },
  "ɔɪ": {
    type: "diphthong", zone: null, tongue: "low-back-to-high-front", lips: "rounded-to-spread",
    example: "boy", exampleHighlight: "oy",
    instruction: "Start with rounded lips saying 'aw', then glide to 'ee' while spreading your lips.",
    instructions: { es: "Empieza con los labios redondeados diciendo 'o' y desliza hacia 'i' abriendo los labios." },
  },
  "aʊ": {
    type: "diphthong", zone: null, tongue: "low-central-to-high-back", lips: "open-to-rounded",
    example: "now", exampleHighlight: "ow",
    instruction: "Start with mouth wide open saying 'ah', then glide to 'oo' while rounding your lips.",
    instructions: { es: "Empieza con la boca bien abierta diciendo 'a' y desliza hacia 'u' redondeando los labios." },
  },
  "oʊ": {
    type: "diphthong", zone: null, tongue: "mid-back-to-high-back", lips: "rounded",
    example: "go", exampleHighlight: "o",
    instruction: "Start with slightly rounded lips saying 'oh', then glide to 'oo'.",
    instructions: { es: "Empieza con los labios ligeramente redondeados diciendo 'o' y desliza hacia 'u'." },
  },
};

export function lookupPhoneme(symbol) {
  return ipaPhonemes[symbol] || null;
}
