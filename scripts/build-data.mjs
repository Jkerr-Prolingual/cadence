/**
 * Build script: generates optimized data files for Relato from source data.
 *
 * Outputs:
 *   src/data/cefrLookup.js   — word → CEFR level map from EFLLex
 *   src/data/lemmaMap.js     — inflected form → headword from wordData.js
 *
 * Run: node scripts/build-data.mjs
 */

import { readFileSync, writeFileSync } from 'fs';

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

function cefrRank(level) {
  const idx = CEFR_ORDER.indexOf(level);
  return idx === -1 ? 99 : idx;
}

// ── Step 1: EFLLex → cefrLookup ──────────────────────────────────────────────

function buildCefrLookup() {
  const efllexPath = 'C:/Users/User/graded_readers/data/efllex.json';
  const entries = JSON.parse(readFileSync(efllexPath, 'utf-8'));

  const singleWord = {};
  const multiWord = {};

  for (const entry of entries) {
    const word = entry.word.toLowerCase();
    const cefr = entry.cefr;

    const target = entry.is_multiword ? multiWord : singleWord;

    if (!target[word] || cefrRank(cefr) < cefrRank(target[word])) {
      target[word] = cefr;
    }
  }

  const lines = [
    '// EFLLex CEFR lookup — word → lowest CEFR level across POS tags',
    `// Generated: ${new Date().toISOString().slice(0, 10)}`,
    `// Single words: ${Object.keys(singleWord).length} | Multi-word: ${Object.keys(multiWord).length}`,
    '',
    'export const cefrLookup = {',
  ];

  const sorted = Object.entries(singleWord).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [word, level] of sorted) {
    lines.push(`${JSON.stringify(word)}:${JSON.stringify(level)},`);
  }
  lines.push('};');

  lines.push('');
  lines.push('export const cefrMultiWord = {');
  const mwSorted = Object.entries(multiWord).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [phrase, level] of mwSorted) {
    lines.push(`${JSON.stringify(phrase)}:${JSON.stringify(level)},`);
  }
  lines.push('};');
  lines.push('');

  writeFileSync('src/data/cefrLookup.js', lines.join('\n'), 'utf-8');

  const counts = {};
  for (const level of CEFR_ORDER) {
    counts[level] = Object.values(singleWord).filter(v => v === level).length;
  }

  console.log('=== cefrLookup.js ===');
  console.log(`Single words: ${Object.keys(singleWord).length}`);
  console.log(`Multi-word:   ${Object.keys(multiWord).length}`);
  console.log('CEFR distribution (single words):');
  for (const lvl of CEFR_ORDER) {
    console.log(`  ${lvl}: ${counts[lvl]}`);
  }
}

// ── Step 2: wordData.js → lemmaMap ───────────────────────────────────────────

function buildLemmaMap() {
  const wordDataPath = 'C:/Users/User/vocab-reader-app/src/wordData.js';
  const raw = readFileSync(wordDataPath, 'utf-8');

  // Extract the object literal from "export const wordData = { ... };"
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) {
    console.error('Could not parse wordData.js');
    process.exit(1);
  }

  // Use Function constructor to evaluate the object literal
  const wordData = new Function(`return ${match[0]}`)();

  const lemmaMap = {};
  let total = 0;
  let selfMaps = 0;

  for (const [form, entry] of Object.entries(wordData)) {
    const headword = entry[2]; // [tier, bnc_band, headword, ngsl, nawl]
    total++;
    if (form === headword) {
      selfMaps++;
      continue; // don't store identity mappings — saves space
    }
    lemmaMap[form] = headword;
  }

  const lines = [
    '// Inflected form → headword lemma map',
    `// Generated: ${new Date().toISOString().slice(0, 10)}`,
    `// Source: wordData.js (${total} forms, ${Object.keys(lemmaMap).length} non-identity mappings)`,
    '',
    'export const lemmaMap = {',
  ];

  const sorted = Object.entries(lemmaMap).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [form, headword] of sorted) {
    lines.push(`${JSON.stringify(form)}:${JSON.stringify(headword)},`);
  }
  lines.push('};');
  lines.push('');

  writeFileSync('src/data/lemmaMap.js', lines.join('\n'), 'utf-8');

  console.log('\n=== lemmaMap.js ===');
  console.log(`Total forms in wordData: ${total}`);
  console.log(`Self-mappings (skipped): ${selfMaps}`);
  console.log(`Non-identity mappings:   ${Object.keys(lemmaMap).length}`);
}

// ── Run ──────────────────────────────────────────────────────────────────────

buildCefrLookup();
buildLemmaMap();
console.log('\nDone.');
