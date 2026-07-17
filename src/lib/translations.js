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
  return dictionaries[l1] || {};
}

export function registerDict(l1, dict) {
  dictionaries[l1] = dict;
}

export function getManifestTranslation(entry, l1) {
  if (!entry) return null;
  return entry.translations?.[l1] || entry.spanish || null;
}

function isFlat(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const first = Object.values(obj)[0];
  return typeof first === 'string';
}

export function getManifestConstituents(entry, l1) {
  if (!entry?.constituents) return null;
  if (isFlat(entry.constituents)) return entry.constituents;
  return entry.constituents[l1] || null;
}

export function getGlossTranslation(gloss, l1) {
  if (!gloss) return null;
  return gloss.translations?.[l1] || gloss.spanish || null;
}

export function getGlossConstituents(gloss, l1) {
  if (!gloss?.constituents) return null;
  if (isFlat(gloss.constituents)) return gloss.constituents;
  return gloss.constituents[l1] || null;
}
