import { lookupCefr, cleanToken } from './wordUtils';

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

