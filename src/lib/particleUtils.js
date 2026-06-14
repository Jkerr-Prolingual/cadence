import { cefrMultiWord } from '../data/cefrLookup';

let _index = null;

function getIndex() {
  if (_index) return _index;
  _index = {};
  for (const [phrase, cefr] of Object.entries(cefrMultiWord)) {
    const words = phrase.toLowerCase().split(/\s+/);
    if (words.length < 2) continue;
    if (words[0].startsWith('-') || /^\d/.test(words[0])) continue;
    const first = words[0];
    if (!_index[first]) _index[first] = [];
    _index[first].push({ words, cefr, phrase });
  }
  for (const arr of Object.values(_index)) {
    arr.sort((a, b) => b.words.length - a.words.length);
  }
  return _index;
}

export function findParticles(wordTokens, manifest = null) {
  const index = getIndex();
  const result = new Map();
  const consumed = new Set();

  const mIdx = {};
  if (manifest?.entries) {
    for (const [phrase, entry] of Object.entries(manifest.entries)) {
      if (entry.type !== 'particle') continue;
      const words = phrase.toLowerCase().split(/\s+/);
      if (words.length < 2) continue;
      const first = words[0];
      if (!mIdx[first]) mIdx[first] = [];
      mIdx[first].push({ words, phrase, ...entry });
    }
    for (const arr of Object.values(mIdx)) {
      arr.sort((a, b) => b.words.length - a.words.length);
    }
  }

  for (let i = 0; i < wordTokens.length; i++) {
    if (consumed.has(i)) continue;
    const first = wordTokens[i].raw.toLowerCase().replace(/[^a-zA-ZÀ-ÿ'-]/g, '');
    if (!first) continue;
    const candidates = [...(mIdx[first] || []), ...(index[first] || [])];

    let match = null;
    for (const c of candidates) {
      if (i + c.words.length > wordTokens.length) continue;
      let ok = true;
      for (let j = 0; j < c.words.length; j++) {
        const tokWord = wordTokens[i + j].raw.toLowerCase().replace(/[^a-zA-ZÀ-ÿ'-]/g, '');
        if (tokWord !== c.words[j]) { ok = false; break; }
      }
      if (ok) { match = c; break; }
    }

    if (match) {
      const group = {
        phrase: match.phrase,
        cefr: match.cefr,
        compositionality: match.compositionality || null,
        spanish: match.spanish || null,
        note: match.note || null,
        constituents_es: match.constituents || null,
        wordIndices: [],
      };
      for (let j = 0; j < match.words.length; j++) {
        consumed.add(i + j);
        group.wordIndices.push(wordTokens[i + j].wordIdx);
        result.set(wordTokens[i + j].wordIdx, group);
      }
      i += match.words.length - 1;
    }
  }

  return result;
}
