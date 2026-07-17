import { cefrLookup, cefrMultiWord } from '../data/cefrLookup.js';
import { lemmaMap } from '../data/lemmaMap.js';

export const CONTRACTIONS = {
  "i'm": 'i am', "i've": 'i have', "i'll": 'i will', "i'd": 'i would',
  "you're": 'you are', "you've": 'you have', "you'll": 'you will', "you'd": 'you would',
  "he's": 'he is', "she's": 'she is', "it's": 'it is',
  "we're": 'we are', "we've": 'we have', "we'll": 'we will', "we'd": 'we would',
  "they're": 'they are', "they've": 'they have', "they'll": 'they will', "they'd": 'they would',
  "that's": 'that is', "who's": 'who is', "what's": 'what is',
  "there's": 'there is', "here's": 'here is',
  "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "hasn't": 'has not', "haven't": 'have not', "hadn't": 'had not',
  "doesn't": 'does not', "don't": 'do not', "didn't": 'did not',
  "won't": 'will not', "wouldn't": 'would not', "shouldn't": 'should not',
  "couldn't": 'could not', "can't": 'cannot', "let's": 'let us',
};

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const CEFR_COLORS = {
  A1: '#22c55e',
  A2: '#3b82f6',
  B1: '#a855f7',
  B2: '#f59e0b',
  C1: '#ef4444',
  unclassified: '#6b7280',
};

export function cleanToken(raw) {
  return raw.replace(/[^a-zA-ZÀ-ÿ'-]/g, '').toLowerCase();
}

export function tokenizeText(text) {
  return text.split(/(\s+|(?=[.,!?;:"""''()[\]{}\-—–/])|(?<=[.,!?;:"""''()[\]{}\-—–/]))/)
    .filter(t => t && t.trim().length > 0);
}

export function expandContraction(token) {
  const lower = token.toLowerCase();
  return CONTRACTIONS[lower] || null;
}

/**
 * Look up CEFR level for a word. Tries direct match first, then lemma.
 * Returns { cefr, lemma, via } where cefr is 'A1'–'C1' or null.
 */
export function lookupCefr(word) {
  const w = cleanToken(word);
  if (!w) return { cefr: null, lemma: w, via: 'empty' };

  const direct = cefrLookup[w];
  const lemma = lemmaMap[w];
  const lemmaLevel = lemma ? cefrLookup[lemma] : null;

  if (direct && lemmaLevel) {
    if (CEFR_LEVELS.indexOf(lemmaLevel) < CEFR_LEVELS.indexOf(direct)) {
      return { cefr: lemmaLevel, lemma, via: 'lemma' };
    }
    return { cefr: direct, lemma: w, via: 'direct' };
  }
  if (direct) return { cefr: direct, lemma: w, via: 'direct' };
  if (lemmaLevel) return { cefr: lemmaLevel, lemma, via: 'lemma' };

  return { cefr: null, lemma: lemma || w, via: 'unclassified' };
}

/**
 * Get the display color for a CEFR level (or unclassified).
 */
export function cefrColor(level) {
  return CEFR_COLORS[level] || CEFR_COLORS.unclassified;
}

/**
 * Check if a word is a function word (A1 level, not worth tracking depth on).
 * Used to filter out "the", "is", "a", etc. from depth tracking.
 */
export function isFunctionWord(word) {
  const { cefr } = lookupCefr(word);
  return cefr === 'A1';
}

export { cefrMultiWord };
