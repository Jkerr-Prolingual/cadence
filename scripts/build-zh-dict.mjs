/**
 * Build script: generates zh_dictionary.js from CC-CEDICT.
 *
 * Parses CC-CEDICT (Chinese→English), inverts to English→Chinese,
 * matches against cefrLookup.js headwords, outputs zh_dictionary.js.
 *
 * Usage:
 *   node scripts/build-zh-dict.mjs                           # downloads from MDBG
 *   node scripts/build-zh-dict.mjs path/to/cedict.txt        # local plaintext
 *   node scripts/build-zh-dict.mjs path/to/cedict.txt.gz     # local gzipped
 *
 * CC-CEDICT license: Creative Commons BY-SA 4.0
 * https://www.mdbg.net/chinese/dictionary?page=cedict
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { gunzipSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CEDICT_URL = 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_FILE = resolve(CACHE_DIR, 'cedict.txt');

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

// ── Download CC-CEDICT ─────────────────────────────────────────────────────

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

async function getCedictText(localPath) {
  if (localPath) {
    console.log(`Reading: ${localPath}`);
    const buf = readFileSync(localPath);
    return localPath.endsWith('.gz')
      ? gunzipSync(buf).toString('utf8')
      : buf.toString('utf8');
  }

  if (existsSync(CACHE_FILE)) {
    console.log(`Using cached CC-CEDICT: ${CACHE_FILE}`);
    return readFileSync(CACHE_FILE, 'utf8');
  }

  console.log(`Downloading CC-CEDICT from MDBG...`);
  const buf = await download(CEDICT_URL);
  const text = gunzipSync(buf).toString('utf8');
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, text, 'utf8');
  console.log(`Cached to ${CACHE_FILE}`);
  return text;
}

// ── Parse CC-CEDICT ────────────────────────────────────────────────────────

function parseCedict(text) {
  const entries = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s*\/(.+)\/\s*$/);
    if (!match) continue;
    const [, , simplified, pinyin, defStr] = match;
    const glosses = defStr.split('/').map(g => g.trim()).filter(Boolean);
    entries.push({ simplified, pinyin, glosses });
  }
  return entries;
}

// ── Extract candidate English base words from a CC-CEDICT gloss ────────────

function extractEnglishWords(gloss) {
  if (/^(CL:|variant of|old variant of|see |abbr\. for|surname |also pr\.|also written|Taiwan pr\.)/.test(gloss)) {
    return [];
  }

  const words = [];
  for (const part of gloss.split(';')) {
    const trimmed = part.trim();
    // Skip literary, archaic, bound-form, and dialect senses — these are
    // not natural modern Chinese and shouldn't be primary ESL translations
    if (/\((literary|bound form|archaic|classical|old|dialect|fig\.|derog)\)/i.test(trimmed)) {
      continue;
    }

    let clean = trimmed
      .replace(/\(.*?\)/g, '')    // (classifier for...), (coll.), etc.
      .replace(/\[.*?\]/g, '')    // [xxx] annotations
      .replace(/^to /i, '')       // "to walk" → "walk"
      .replace(/^(a|an) /i, '')   // "a house" → "house"
      .trim()
      .toLowerCase();

    if (clean && /^[a-z]+$/.test(clean)) {
      words.push(clean);
    }
  }
  return words;
}

// ── Build inverted index: English word → Chinese candidates ────────────────

function buildInvertedIndex(entries) {
  const index = {};
  for (const entry of entries) {
    for (let gi = 0; gi < entry.glosses.length; gi++) {
      for (const word of extractEnglishWords(entry.glosses[gi])) {
        if (!index[word]) index[word] = [];
        index[word].push({
          simplified: entry.simplified,
          glossIndex: gi,
          totalGlosses: entry.glosses.length,
        });
      }
    }
  }
  return index;
}

// ── Character frequency table ──────────────────────────────────────────────
// Common characters appear in many compound entries (吃 → 吃饭, 吃食, 吃亏...).
// Rare literary characters (敳, 茕) appear in almost no compounds.

function computeCharFreq(entries) {
  const freq = {};
  for (const entry of entries) {
    for (const ch of entry.simplified) {
      freq[ch] = (freq[ch] || 0) + 1;
    }
  }
  return freq;
}

// ── Pick best Chinese translation for an English word ──────────────────────

function pickBest(candidates, charFreq) {
  const byChar = {};
  for (const c of candidates) {
    let score = 0;
    if (c.glossIndex === 0) score += 10;
    else if (c.glossIndex === 1) score += 5;
    else if (c.glossIndex === 2) score += 2;

    const len = c.simplified.length;
    if (len === 1) {
      // Use compound frequency as commonness signal.
      // 吃 appears in 80+ entries, 敳 in 1-2.
      const freq = charFreq[c.simplified] || 0;
      if (freq >= 50) score += 4;
      else if (freq >= 20) score += 2;
      else if (freq >= 5) score += 0;
      else score -= 4;
    } else if (len === 2) {
      score += 2;
    } else if (len === 3) {
      score += 0.5;
    }

    if (!byChar[c.simplified] || score > byChar[c.simplified].score) {
      byChar[c.simplified] = { simplified: c.simplified, score };
    }
  }

  const sorted = Object.values(byChar).sort((a, b) => b.score - a.score);
  const best = sorted[0];
  if (sorted.length > 1 && sorted[1].score >= best.score - 3) {
    return `${best.simplified} / ${sorted[1].simplified}`;
  }
  return best.simplified;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const localPath = process.argv[2] || null;

  const cefrWords = loadCefrWords();
  console.log(`cefrLookup headwords: ${cefrWords.size}`);

  const text = await getCedictText(localPath);
  const entries = parseCedict(text);
  console.log(`CC-CEDICT entries parsed: ${entries.length}`);

  const index = buildInvertedIndex(entries);
  console.log(`Inverted index: ${Object.keys(index).length} English words`);

  const charFreq = computeCharFreq(entries);
  console.log(`Character frequency table: ${Object.keys(charFreq).length} unique chars`);

  const dict = {};
  const missed = [];
  for (const word of cefrWords) {
    const candidates = index[word];
    if (candidates && candidates.length > 0) {
      dict[word] = pickBest(candidates, charFreq);
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
    '// Mandarin translations for EFLLex vocabulary',
    '// Source: CC-CEDICT (Creative Commons BY-SA 4.0)',
    '// https://www.mdbg.net/chinese/dictionary?page=cedict',
    `// Generated: ${new Date().toISOString().slice(0, 10)}`,
    `// Entries: ${sorted.length}`,
    '',
    'export const mandarinDict = {',
  ];
  for (const k of sorted) {
    lines.push(`${JSON.stringify(k)}:${JSON.stringify(dict[k])},`);
  }
  lines.push('};');
  lines.push('');

  const outPath = resolve(ROOT, 'src/data/zh_dictionary.js');
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\nWrote ${sorted.length} entries to src/data/zh_dictionary.js`);
}

main().catch(e => { console.error(e); process.exit(1); });
