import { spanishDict } from '../data/es_dictionary';
import { mandarinDict } from '../data/zh_dictionary';
import { japaneseDict } from '../data/ja_dictionary';
import { koreanDict } from '../data/ko_dictionary';

const dictionaries = {
  es: spanishDict,
  zh: mandarinDict,
  ja: japaneseDict,
  ko: koreanDict,
};

export function getL1Dict(l1) {
  if (l1 === 'en') return dictionaries.es || {};
  return dictionaries[l1] || {};
}

export function getManifestTranslation(entry, l1) {
  if (!entry) return null;
  if (entry.translations?.[l1]) return entry.translations[l1];
  if (entry.spanish) return entry.spanish;
  if (l1 === 'en' && entry.translations) {
    return entry.translations.es || Object.values(entry.translations)[0] || null;
  }
  return null;
}

function isFlat(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const first = Object.values(obj)[0];
  return typeof first === 'string';
}

export function getManifestConstituents(entry, l1) {
  if (!entry?.constituents) return null;
  if (isFlat(entry.constituents)) return entry.constituents;
  if (entry.constituents[l1]) return entry.constituents[l1];
  if (l1 === 'en') {
    return entry.constituents.es || Object.values(entry.constituents)[0] || null;
  }
  return null;
}

export function getGlossTranslation(gloss, l1) {
  if (!gloss) return null;
  if (gloss.translations?.[l1]) return gloss.translations[l1];
  if (gloss.spanish) return gloss.spanish;
  if (l1 === 'en' && gloss.translations) {
    return gloss.translations.es || Object.values(gloss.translations)[0] || null;
  }
  return null;
}

export function getGlossConstituents(gloss, l1) {
  if (!gloss?.constituents) return null;
  if (isFlat(gloss.constituents)) return gloss.constituents;
  if (gloss.constituents[l1]) return gloss.constituents[l1];
  if (l1 === 'en') {
    return gloss.constituents.es || Object.values(gloss.constituents)[0] || null;
  }
  return null;
}
