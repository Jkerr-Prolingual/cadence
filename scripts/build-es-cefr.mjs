/**
 * Build script: generates cefrLookupEs.js from ELELex.
 *
 * Downloads ELELex TSV (Spanish CEFR-graded vocabulary from CEFRLex),
 * applies Rule C to derive a single CEFR level per lemma,
 * outputs src/data/cefrLookupEs.js.
 *
 * Usage:
 *   node scripts/build-es-cefr.mjs                    # downloads from CEFRLex
 *   node scripts/build-es-cefr.mjs path/to/ELELex.tsv # local file
 *
 * ELELex license: CC BY-NC-SA 4.0
 * https://cental.uclouvain.be/cefrlex/elelex/
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ELELEX_URL = 'https://cental.uclouvain.be/cefrlex/static/resources/es/ELELex.tsv';
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_FILE = resolve(CACHE_DIR, 'ELELex.tsv');

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

function cefrRank(level) {
  const idx = CEFR_ORDER.indexOf(level);
  return idx === -1 ? 99 : idx;
}

// ── Download ───────────────────────────────────────────────────────────────

function download(url) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, { headers: { 'User-Agent': 'Relato-BuildScript/1.0' } }, (resp) => {
        if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
          follow(resp.headers.location);
          return;
        }
        if (resp.statusCode !== 200) {
          reject(new Error(`HTTP ${resp.statusCode} from ${u}`));
          return;
        }
        const chunks = [];
        resp.on('data', c => chunks.push(c));
        resp.on('end', () => resolve(Buffer.concat(chunks)));
        resp.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

async function getElelexText(localPath) {
  if (localPath) {
    console.log(`Reading: ${localPath}`);
    return readFileSync(localPath, 'utf8');
  }

  if (existsSync(CACHE_FILE)) {
    console.log(`Using cached ELELex: ${CACHE_FILE}`);
    return readFileSync(CACHE_FILE, 'utf8');
  }

  console.log(`Downloading ELELex from CEFRLex...`);
  const buf = await download(ELELEX_URL);
  const text = buf.toString('utf8');
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, text, 'utf8');
  console.log(`Cached to ${CACHE_FILE} (${(buf.length / 1024).toFixed(0)} KB)`);
  return text;
}

// ── Rule C ─────────────────────────────────────────────────────────────────
// Same algorithm as graded_readers/methodology/vocabulary_framework.md §5

function applyRuleC(freqs) {
  const peak = Math.max(...freqs);
  if (peak === 0) return null;
  const threshold = Math.max(0.2 * peak, 1.0);

  for (let i = 0; i < CEFR_ORDER.length; i++) {
    if (freqs[i] >= threshold) return CEFR_ORDER[i];
  }
  // Fallback: lowest non-zero level
  for (let i = 0; i < CEFR_ORDER.length; i++) {
    if (freqs[i] > 0) return CEFR_ORDER[i];
  }
  return null;
}

// ── Parse ELELex TSV ───────────────────────────────────────────────────────
// Columns: word, tag, level_freq@a1, level_freq@a2, level_freq@b1,
//          level_freq@b2, level_freq@c1, total_freq@total, ...

function parseElelex(text) {
  const lines = text.split('\n');
  const entries = [];

  // Detect header line (columns may be double-quoted)
  const header = lines[0].split('\t').map(h => h.replace(/^"|"$/g, ''));
  const wordCol = header.indexOf('word');
  const tagCol = header.indexOf('tag');
  const a1Col = header.indexOf('level_freq@a1');
  const a2Col = header.indexOf('level_freq@a2');
  const b1Col = header.indexOf('level_freq@b1');
  const b2Col = header.indexOf('level_freq@b2');
  const c1Col = header.indexOf('level_freq@c1');

  if (wordCol === -1 || a1Col === -1) {
    console.error('Unexpected TSV header:', header.slice(0, 10).join(', '));
    console.error('Expected columns: word, tag, level_freq@a1, ...');
    process.exit(1);
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split('\t').map(c => c.replace(/^"|"$/g, ''));
    const word = cols[wordCol];
    const tag = cols[tagCol] || '';
    if (!word) continue;

    const freqs = [
      parseFloat(cols[a1Col]) || 0,
      parseFloat(cols[a2Col]) || 0,
      parseFloat(cols[b1Col]) || 0,
      parseFloat(cols[b2Col]) || 0,
      parseFloat(cols[c1Col]) || 0,
    ];

    entries.push({ word: word.toLowerCase(), tag, freqs });
  }

  return entries;
}

// ── Build ──────────────────────────────────────────────────────────────────

async function main() {
  const localPath = process.argv[2];
  const text = await getElelexText(localPath);
  const entries = parseElelex(text);

  console.log(`Parsed ${entries.length} ELELex entries`);

  const singleWord = {};
  const multiWord = {};
  let skippedNoLevel = 0;

  for (const entry of entries) {
    const cefr = applyRuleC(entry.freqs);
    if (!cefr) { skippedNoLevel++; continue; }

    const isMulti = entry.word.includes(' ');
    const target = isMulti ? multiWord : singleWord;

    if (!target[entry.word] || cefrRank(cefr) < cefrRank(target[entry.word])) {
      target[entry.word] = cefr;
    }
  }

  // Write output
  const lines = [
    '// ELELex CEFR lookup — Spanish word → lowest CEFR level across POS tags',
    '// Source: CEFRLex / ELELex (CC BY-NC-SA 4.0)',
    '// https://cental.uclouvain.be/cefrlex/elelex/',
    `// Generated: ${new Date().toISOString().slice(0, 10)}`,
    `// Single words: ${Object.keys(singleWord).length} | Multi-word: ${Object.keys(multiWord).length}`,
    '',
    'export const cefrLookupEs = {',
  ];

  const sorted = Object.entries(singleWord).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [word, level] of sorted) {
    lines.push(`${JSON.stringify(word)}:${JSON.stringify(level)},`);
  }
  lines.push('};');

  lines.push('');
  lines.push('export const cefrMultiWordEs = {');
  const mwSorted = Object.entries(multiWord).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [phrase, level] of mwSorted) {
    lines.push(`${JSON.stringify(phrase)}:${JSON.stringify(level)},`);
  }
  lines.push('};');
  lines.push('');

  const outPath = resolve(ROOT, 'src/data/cefrLookupEs.js');
  writeFileSync(outPath, lines.join('\n'), 'utf-8');

  // Stats
  const counts = {};
  for (const level of CEFR_ORDER) {
    counts[level] = Object.values(singleWord).filter(v => v === level).length;
  }

  console.log('\n=== cefrLookupEs.js ===');
  console.log(`Single words: ${Object.keys(singleWord).length}`);
  console.log(`Multi-word:   ${Object.keys(multiWord).length}`);
  console.log(`Skipped (no level): ${skippedNoLevel}`);
  console.log('CEFR distribution (single words):');
  for (const lvl of CEFR_ORDER) {
    console.log(`  ${lvl}: ${counts[lvl]}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
