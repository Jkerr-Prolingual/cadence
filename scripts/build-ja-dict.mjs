/**
 * Build script: generates ja_dictionary.js from JMdict.
 *
 * Parses JMdict XML (Japanese→English), inverts to English→Japanese,
 * matches against cefrLookup.js headwords, outputs ja_dictionary.js.
 *
 * Usage:
 *   node scripts/build-ja-dict.mjs                              # downloads JMdict_e.gz
 *   node scripts/build-ja-dict.mjs path/to/JMdict_e             # local XML
 *   node scripts/build-ja-dict.mjs path/to/JMdict_e.gz          # local gzipped
 *
 * JMdict license: Creative Commons BY-SA 4.0
 * https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { gunzipSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const JMDICT_URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz';
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_FILE = resolve(CACHE_DIR, 'JMdict_e.xml');

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
  const client = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      const c = u.startsWith('https') ? https : http;
      c.get(u, { headers: { 'User-Agent': 'Relato-BuildScript/1.0' } }, (resp) => {
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

async function getJmdictXml(localPath) {
  if (localPath) {
    console.log(`Reading: ${localPath}`);
    const buf = readFileSync(localPath);
    return localPath.endsWith('.gz')
      ? gunzipSync(buf).toString('utf8')
      : buf.toString('utf8');
  }

  if (existsSync(CACHE_FILE)) {
    console.log(`Using cached JMdict: ${CACHE_FILE}`);
    return readFileSync(CACHE_FILE, 'utf8');
  }

  console.log(`Downloading JMdict_e.gz from EDRDG...`);
  const buf = await download(JMDICT_URL);
  const text = gunzipSync(buf).toString('utf8');
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, text, 'utf8');
  console.log(`Cached to ${CACHE_FILE}`);
  return text;
}

// ── Parse JMdict XML ───────────────────────────────────────────────────────

function unescapeXml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseJmdict(xml) {
  const entries = [];
  const chunks = xml.split('</entry>');

  for (const chunk of chunks) {
    const start = chunk.indexOf('<entry>');
    if (start === -1) continue;
    const block = chunk.slice(start);

    const kanji = block.match(/<keb>([^<]+)<\/keb>/)?.[1] || null;
    const reading = block.match(/<reb>([^<]+)<\/reb>/)?.[1] || null;
    if (!kanji && !reading) continue;

    // Priority codes (ichi1, news1, spec1 = common words)
    const priCodes = new Set();
    const priRegex = /<[kr]e_pri>([^<]+)<\/[kr]e_pri>/g;
    let pm;
    while ((pm = priRegex.exec(block)) !== null) {
      priCodes.add(pm[1]);
    }

    // Parse senses — each <sense> has one or more <gloss> and optional <misc> tags
    const senses = [];
    const senseChunks = block.split('</sense>');
    for (const sc of senseChunks) {
      if (sc.indexOf('<sense>') === -1) continue;
      const glosses = [];
      const glossRegex = /<gloss[^>]*>([^<]+)<\/gloss>/g;
      let gm;
      while ((gm = glossRegex.exec(sc)) !== null) {
        glosses.push(unescapeXml(gm[1]));
      }
      // Detect register/usage markers from <misc> entity references
      const miscFlags = new Set();
      const miscRegex = /&(hon|hum|pol|arch|obs|rare|sl|col|vulg|id);/g;
      let mm;
      while ((mm = miscRegex.exec(sc)) !== null) {
        miscFlags.add(mm[1]);
      }
      if (glosses.length > 0) senses.push({ glosses, misc: miscFlags });
    }

    if (senses.length > 0) {
      entries.push({
        word: kanji || reading,
        senses,
        priority: priCodes,
      });
    }
  }
  return entries;
}

// ── Extract candidate English words from a JMdict gloss ────────────────────

function extractEnglishWords(gloss) {
  const words = [];
  let clean = gloss
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/^to /i, '')
    .replace(/^(a|an) /i, '')
    .trim()
    .toLowerCase();

  if (clean && /^[a-z]+$/.test(clean)) {
    words.push(clean);
  }
  return words;
}

// ── Build inverted index: English word → Japanese candidates ───────────────

function buildInvertedIndex(entries) {
  const index = Object.create(null);
  for (const entry of entries) {
    for (let si = 0; si < entry.senses.length; si++) {
      const sense = entry.senses[si];
      for (const gloss of sense.glosses) {
        for (const word of extractEnglishWords(gloss)) {
          if (!index[word]) index[word] = [];
          index[word].push({
            japanese: entry.word,
            senseIndex: si,
            totalSenses: entry.senses.length,
            priority: entry.priority,
            misc: sense.misc,
          });
        }
      }
    }
  }
  return index;
}

// ── Pick best Japanese translation for an English word ─────────────────────

function pickBest(candidates) {
  const byWord = {};
  for (const c of candidates) {
    let score = 0;
    if (c.senseIndex === 0) score += 10;
    else if (c.senseIndex === 1) score += 5;
    else if (c.senseIndex === 2) score += 2;

    // JMdict priority codes — reliable commonness signal
    if (c.priority.has('ichi1') || c.priority.has('news1') || c.priority.has('spec1')) {
      score += 5;
    } else if (c.priority.has('ichi2') || c.priority.has('news2') || c.priority.has('spec2')) {
      score += 2;
    }

    // Penalize non-plain register: keigo, archaic, obsolete, slang
    if (c.misc.has('hon') || c.misc.has('hum')) score -= 6;
    if (c.misc.has('arch') || c.misc.has('obs')) score -= 8;
    if (c.misc.has('rare')) score -= 3;
    if (c.misc.has('vulg')) score -= 4;

    if (!byWord[c.japanese] || score > byWord[c.japanese].score) {
      byWord[c.japanese] = { japanese: c.japanese, score };
    }
  }

  const sorted = Object.values(byWord).sort((a, b) => b.score - a.score);
  const best = sorted[0];
  if (sorted.length > 1 && sorted[1].score >= best.score - 3) {
    return `${best.japanese} / ${sorted[1].japanese}`;
  }
  return best.japanese;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const localPath = process.argv[2] || null;

  const cefrWords = loadCefrWords();
  console.log(`cefrLookup headwords: ${cefrWords.size}`);

  const xml = await getJmdictXml(localPath);
  const entries = parseJmdict(xml);
  console.log(`JMdict entries parsed: ${entries.length}`);

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
    '// Japanese translations for EFLLex vocabulary',
    '// Source: JMdict (Creative Commons BY-SA 4.0)',
    '// https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project',
    `// Generated: ${new Date().toISOString().slice(0, 10)}`,
    `// Entries: ${sorted.length}`,
    '',
    'export const japaneseDict = {',
  ];
  for (const k of sorted) {
    lines.push(`${JSON.stringify(k)}:${JSON.stringify(dict[k])},`);
  }
  lines.push('};');
  lines.push('');

  const outPath = resolve(ROOT, 'src/data/ja_dictionary.js');
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\nWrote ${sorted.length} entries to src/data/ja_dictionary.js`);
}

main().catch(e => { console.error(e); process.exit(1); });
