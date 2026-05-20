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

export const BAND_TIER_MAP = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 6,
};

export const TIER_LABELS = {
  1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2',
};

export const TIER_COLORS = {
  1: '#22c55e',
  2: '#3b82f6',
  3: '#a855f7',
  4: '#f59e0b',
  5: '#ef4444',
  6: '#6b7280',
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
