import { lookupCefr, cleanToken, CEFR_LEVELS, CEFR_COLORS } from './wordUtils';

export { CEFR_LEVELS, CEFR_COLORS };

export function analyzeText(text) {
  if (!text) return null;

  const words = text.match(/[a-zA-ZÀ-ÿ'''-]+/g) || [];
  const wordCount = words.length;

  const cefrDist = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, unclassified: 0 };
  const uniqueWords = new Set();

  for (const word of words) {
    const cleaned = cleanToken(word);
    if (!cleaned) continue;
    const { cefr, lemma } = lookupCefr(word);
    const level = cefr || 'unclassified';
    cefrDist[level]++;
    uniqueWords.add(lemma || cleaned);
  }

  const contentWordCount = wordCount - cefrDist.A1;
  const lexicalDensity = wordCount > 0 ? Math.round((contentWordCount / wordCount) * 100) / 100 : 0;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  return {
    wordCount,
    uniqueWordCount: uniqueWords.size,
    contentWordCount,
    lexicalDensity,
    sentenceCount,
    avgSentenceLength,
    cefrDist,
  };
}

export function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildAnalysisPrompt(title, text, cefrEstimate) {
  const truncated = text.split(/\s+/).slice(0, 4500).join(' ');

  return `You are a vocabulary analyst for Relato, an ESL reading app targeting A2–B2 Spanish-speaking learners (primarily adolescent and young adult long-term English learners).

Analyze the following text and return a JSON object with the fields specified below.

**Text title:** ${title}
**Target CEFR level:** ${cefrEstimate}

**Text:**
${truncated}

---

Return ONLY valid JSON (no markdown fences, no commentary) with these fields:

{
  "topicLabel": "2–4 word topic label for this text",

  "topicCluster": [
    {"word": "headword", "sentence": "verbatim sentence from text containing this word"}
  ],
  // 5–10 content words central to this text's topic. Use verbatim sentences only.

  "properNouns": ["character names", "place names"],

  "registerProfile": "Brief description of register, tone, and formality level",

  "difficultyNotes": "Potential comprehension challenges for L1 Spanish A2–B2 learners",

  "particles": [
    {
      "chunk": "multi-word expression as it appears in text",
      "type": "compositional | non-compositional",
      "spanish": "Spanish translation of the chunk as a whole unit",
      "sentence": "verbatim sentence from text"
    }
  ],
  // Multi-word expressions the learner should process as single cognitive units.
  // "compositional" = meaning derivable from parts (e.g., "living room", "front door")
  // "non-compositional" = meaning NOT derivable from parts (e.g., "of course", "look at")
  // Include 3–8 particles that appear in the text.

  "textCollocates": [
    {"anchor": "verb or adjective", "collocate": "noun or preposition", "sentence": "verbatim sentence"}
  ],
  // Significant word combinations in the text. 3–6 items.

  "morphologicalFamilies": [
    {"base": "headword", "forms": ["inflected1", "inflected2"], "sentence": "verbatim sentence"}
  ],
  // Word families with multiple forms appearing in the text. 3–6 families.

  "probePool": [
    {
      "word": "headword",
      "form": "form as it appears in text",
      "cefr": "A1 | A2 | B1 | B2 | C1",
      "sentence": "verbatim sentence from text",
      "questionType": "meaning | cloze | context",
      "question": "the question stem",
      "correct": "correct answer",
      "distractors": ["wrong1", "wrong2", "wrong3"]
    }
  ],
  // 10–15 vocabulary probe questions of mixed types:
  //
  // "meaning" — Tests contextual comprehension. The question field MUST be
  //   exactly: "What does '[word]' mean in this sentence?"
  //   ALL OPTIONS (correct + distractors) must be in SPANISH. For polysemous
  //   words, the correct answer is the contextual Spanish translation;
  //   distractors are other real Spanish translations of the same English
  //   word (different senses). This forces the learner to discriminate
  //   meaning in context.
  //   Example: word="run", sentence="She runs the company."
  //     question="What does 'run' mean in this sentence?"
  //     correct="dirigir", distractors=["correr","funcionar","fluir"]
  //
  // "cloze" — Tests form recognition. Shows the sentence with the target
  //   word blanked out. Options are word forms (correct form + morphological
  //   distractors). The question field contains the sentence with ___ for
  //   the blank.
  //   Example: question="She ___ the door quickly."
  //     correct="opened", distractors=["opening","opens","open"]
  //
  // "context" — Tests recognition across contexts. Shows 4 sentences and
  //   asks which one uses the word with a specific meaning. The question
  //   field MUST include the Spanish meaning, e.g.:
  //   "Which sentence uses 'check' to mean 'examinar'?"
  //   Correct is a verbatim sentence from the text; distractors are
  //   plausible sentences you create.
  //   Example: word="check"
  //     question="Which sentence uses 'check' to mean 'examinar'?"
  //     correct="He checked the board carefully."
  //     distractors=["She wrote a check for $50.", ...]
  //
  // Target B1+ words primarily. Include 2–3 polysemous A2 words.
  // Distractors must be plausible for Spanish-speaking learners at A2–B2.
  // The "cefr" field is the EFLLex CEFR level of the target word.

  "cognates": [
    {
      "word": "English word from the text",
      "spanish": "Spanish cognate",
      "transparent": true,
      "note": "Brief note on cognate relationship"
    }
  ]
  // Spanish-English cognates found in the text. 3–8 items.
  // transparent=true: helpful cognate (e.g., "family"/"familia")
  // transparent=false: false friend (e.g., "actually"/"actualmente")
}`;
}
