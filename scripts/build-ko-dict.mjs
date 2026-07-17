/**
 * Build script: generates ko_dictionary.js from KENGDIC.
 *
 * Parses KENGDIC TSV (Korean→English), inverts to English→Korean,
 * matches against cefrLookup.js headwords, outputs ko_dictionary.js.
 *
 * Usage:
 *   node scripts/build-ko-dict.mjs                              # downloads from GitHub
 *   node scripts/build-ko-dict.mjs path/to/kengdic.tsv          # local file
 *
 * KENGDIC license: MPL 2.0 / LGPL 2.0+
 * https://github.com/garfieldnate/kengdic
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const KENGDIC_URL = 'https://raw.githubusercontent.com/garfieldnate/kengdic/master/kengdic.tsv';
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_FILE = resolve(CACHE_DIR, 'kengdic.tsv');

// ── Load cefrLookup headwords ──────────────────────────────────────────────

function loadCefrWords() {
  const src = readFileSync(resolve(ROOT, 'src/data/cefrLookup.js'), 'utf8');
  const words = new Set();
  const lookupStart = src.indexOf('export const cefrLookup');
  const multiStart = src.indexOf('export const cefrMultiWord');
  const section = src.slice(lookupStart, multiStart > 0 ? multiStart : undefined);
  const re = /"([^"]+)":/g;
  let m;
  while ((m = re.exec(section)) !== null) {
    words.add(m[1]);
  }
  return words;
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

async function getKengdicText(localPath) {
  if (localPath) {
    console.log(`Reading: ${localPath}`);
    return readFileSync(localPath, 'utf8');
  }

  if (existsSync(CACHE_FILE)) {
    console.log(`Using cached KENGDIC: ${CACHE_FILE}`);
    return readFileSync(CACHE_FILE, 'utf8');
  }

  console.log(`Downloading KENGDIC from GitHub (~90MB, may take a minute)...`);
  const buf = await download(KENGDIC_URL);
  const text = buf.toString('utf8');
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, text, 'utf8');
  console.log(`Cached to ${CACHE_FILE}`);
  return text;
}

// ── Parse KENGDIC TSV ──────────────────────────────────────────────────────

function parseKengdic(text) {
  const lines = text.split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
  const surfaceIdx = headers.indexOf('surface');
  const glossIdx = headers.indexOf('gloss');

  if (surfaceIdx === -1 || glossIdx === -1) {
    console.error('Could not find surface/gloss columns. Headers:', headers);
    process.exit(1);
  }

  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const surface = cols[surfaceIdx]?.trim();
    const gloss = cols[glossIdx]?.trim();
    if (!surface || !gloss || gloss === 'None') continue;
    entries.push({ korean: surface, gloss });
  }
  return entries;
}

// ── Extract candidate English words from a KENGDIC gloss ───────────────────

function extractEnglishWords(gloss) {
  const words = [];
  // Split on commas, semicolons, and slashes
  for (const part of gloss.split(/[,;\/]/)) {
    let clean = part.trim()
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/^to /i, '')
      .replace(/^(a|an) /i, '')
      .trim()
      .toLowerCase();

    if (clean && /^[a-z]+$/.test(clean)) {
      words.push(clean);
    }
  }
  return words;
}

// ── Build inverted index: English word → Korean candidates ─────────────────

function buildInvertedIndex(entries) {
  const index = Object.create(null);
  for (const entry of entries) {
    const engWords = extractEnglishWords(entry.gloss);
    for (let gi = 0; gi < engWords.length; gi++) {
      const word = engWords[gi];
      if (!index[word]) index[word] = [];
      index[word].push({
        korean: entry.korean,
        glossIndex: gi,
        totalGlosses: engWords.length,
      });
    }
  }
  return index;
}

// ── Pick best Korean translation for an English word ───────────────────────

function pickBest(candidates) {
  const byWord = {};
  for (const c of candidates) {
    let score = 0;
    if (c.glossIndex === 0) score += 10;
    else if (c.glossIndex === 1) score += 5;
    else if (c.glossIndex === 2) score += 2;

    // Prefer shorter Korean words (more basic/common)
    const len = c.korean.length;
    if (len <= 2) score += 2;
    else if (len === 3) score += 1;
    else if (len >= 5) score -= 1;

    if (!byWord[c.korean] || score > byWord[c.korean].score) {
      byWord[c.korean] = { korean: c.korean, score };
    }
  }

  const sorted = Object.values(byWord).sort((a, b) => b.score - a.score);
  const best = sorted[0];
  if (sorted.length > 1 && sorted[1].score >= best.score - 3) {
    return `${best.korean} / ${sorted[1].korean}`;
  }
  return best.korean;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const localPath = process.argv[2] || null;

  const cefrWords = loadCefrWords();
  console.log(`cefrLookup headwords: ${cefrWords.size}`);

  const text = await getKengdicText(localPath);
  const entries = parseKengdic(text);
  console.log(`KENGDIC entries parsed: ${entries.length}`);

  const index = buildInvertedIndex(entries);
  console.log(`Inverted index: ${Object.keys(index).length} English words`);

  const dict = {};
  const missed = [];
  for (const word of cefrWords) {
    const candidates = index[word];
    if (candidates && candidates.length > 0) {
      dict[word] = pickBest(candidates);
    } else {
      missed.push(word);
    }
  }

  const matched = Object.keys(dict).length;
  const pct = ((matched / cefrWords.size) * 100).toFixed(1);
  console.log(`\nMatched: ${matched} / ${cefrWords.size} (${pct}%)`);
  console.log(`Missed:  ${missed.length}`);
  if (missed.length > 0 && missed.length <= 50) {
    console.log(`Missed words: ${missed.join(', ')}`);
  } else if (missed.length > 50) {
    console.log(`First 50 missed: ${missed.slice(0, 50).join(', ')}`);
    console.log(`  ... and ${missed.length - 50} more`);
  }

  // Generate output
  const sorted = Object.keys(dict).sort();
  const lines = [
    '// Korean translations for EFLLex vocabulary',
    '// Source: KENGDIC (MPL 2.0 / LGPL 2.0+)',
    '// https://github.com/garfieldnate/kengdic',
    `// Generated: ${new Date().toISOString().slice(0, 10)}`,
    `// Entries: ${sorted.length}`,
    '',
    'export const koreanDict = {',
  ];
  for (const k of sorted) {
    lines.push(`${JSON.stringify(k)}:${JSON.stringify(dict[k])},`);
  }
  lines.push('};');
  lines.push('');

  const outPath = resolve(ROOT, 'src/data/ko_dictionary.js');
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\nWrote ${sorted.length} entries to src/data/ko_dictionary.js`);
}

main().catch(e => { console.error(e); process.exit(1); });
