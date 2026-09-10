/**
 * Build script: generates lemmaMapEs.js from FreeLing's Spanish
 * morphological dictionary.
 *
 * Downloads the individual dictionary entry files from the FreeLing
 * GitHub repo (data/es/dictionary/entries/MM.*), parses form→lemma
 * mappings, outputs src/data/lemmaMapEs.js.
 *
 * Usage:
 *   node scripts/build-es-lemmas.mjs                        # downloads from GitHub
 *   node scripts/build-es-lemmas.mjs path/to/entries-dir/   # local directory with MM.* files
 *
 * FreeLing license: AGPL 3.0
 * https://github.com/TALP-UPC/FreeLing
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_ENTRIES_DIR = resolve(CACHE_DIR, 'freeling_es_entries');

const RAW_BASE = 'https://raw.githubusercontent.com/TALP-UPC/FreeLing/4.2/data/es/dictionary/entries';
const DICT_FILES = ['MM.adj', 'MM.adv', 'MM.int', 'MM.nom', 'MM.tanc', 'MM.vaux', 'MM.verb'];

// ── Download with redirect following ──────────────────────────────────────

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

async function getEntries(localPath) {
  // Local directory with MM.* files
  if (localPath) {
    console.log(`Reading entries from: ${localPath}`);
    const files = {};
    for (const f of DICT_FILES) {
      const p = resolve(localPath, f);
      if (existsSync(p)) {
        files[f] = readFileSync(p, 'utf8');
        console.log(`  Read: ${f}`);
      }
    }
    return files;
  }

  // Check cache
  if (existsSync(CACHE_ENTRIES_DIR) && readdirSync(CACHE_ENTRIES_DIR).length >= DICT_FILES.length) {
    console.log(`Using cached FreeLing entries: ${CACHE_ENTRIES_DIR}`);
    const files = {};
    for (const f of DICT_FILES) {
      const p = resolve(CACHE_ENTRIES_DIR, f);
      if (existsSync(p)) files[f] = readFileSync(p, 'utf8');
    }
    return files;
  }

  // Download individual files from GitHub raw
  console.log('Downloading FreeLing Spanish dictionary entries from GitHub...');
  mkdirSync(CACHE_ENTRIES_DIR, { recursive: true });
  const files = {};

  for (const f of DICT_FILES) {
    const url = `${RAW_BASE}/${f}`;
    console.log(`  Downloading ${f}...`);
    try {
      const buf = await download(url);
      const text = buf.toString('utf8');
      files[f] = text;
      writeFileSync(resolve(CACHE_ENTRIES_DIR, f), text, 'utf8');
      console.log(`    ${(buf.length / 1024).toFixed(0)} KB`);
    } catch (err) {
      console.warn(`    Failed: ${err.message}`);
    }
  }

  if (Object.keys(files).length === 0) {
    console.error('No dictionary files downloaded successfully.');
    process.exit(1);
  }

  console.log(`Cached ${Object.keys(files).length} files to ${CACHE_ENTRIES_DIR}`);
  return files;
}

// ── Parse FreeLing dictionary entries ─────────────────────────────────────
// Format: form lemma1 POS1 [lemma2 POS2 ...]
// We extract form→first-lemma mappings.

function parseDictEntries(files) {
  const map = {}; // form → lemma
  let total = 0;
  let selfMaps = 0;

  for (const [filename, content] of Object.entries(files)) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const parts = trimmed.split(/\s+/);
      if (parts.length < 3) continue;

      const form = parts[0].toLowerCase();
      const lemma = parts[1].toLowerCase();
      total++;

      if (form === lemma) {
        selfMaps++;
        continue;
      }

      if (!map[form]) {
        map[form] = lemma;
      }
    }
  }

  return { map, total, selfMaps };
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const localPath = process.argv[2];
  const files = await getEntries(localPath);

  console.log(`\nParsing ${Object.keys(files).length} dictionary files...`);
  const { map, total, selfMaps } = parseDictEntries(files);

  // Filter to lemmas that exist in cefrLookupEs
  const cefrPath = resolve(ROOT, 'src/data/cefrLookupEs.js');
  let filtered = map;
  let filterCount = 0;
  if (existsSync(cefrPath)) {
    const src = readFileSync(cefrPath, 'utf8');
    const headwords = new Set();
    const re = /"([^"]+)":/g;
    let m;
    while ((m = re.exec(src)) !== null) headwords.add(m[1]);
    console.log(`Filtering to ${headwords.size} cefrLookupEs headwords...`);

    filtered = {};
    for (const [form, lemma] of Object.entries(map)) {
      if (headwords.has(lemma)) {
        filtered[form] = lemma;
      } else {
        filterCount++;
      }
    }
  }

  // Write output
  const lines = [
    '// Spanish inflected form → headword lemma map',
    '// Source: FreeLing 4.2 morphological dictionary (AGPL 3.0)',
    '// https://github.com/TALP-UPC/FreeLing',
    `// Generated: ${new Date().toISOString().slice(0, 10)}`,
    `// Source: ${total} forms, ${Object.keys(filtered).length} non-identity mappings`,
    '',
    'export const lemmaMapEs = {',
  ];

  const sorted = Object.entries(filtered).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [form, headword] of sorted) {
    lines.push(`${JSON.stringify(form)}:${JSON.stringify(headword)},`);
  }
  lines.push('};');
  lines.push('');

  const outPath = resolve(ROOT, 'src/data/lemmaMapEs.js');
  writeFileSync(outPath, lines.join('\n'), 'utf-8');

  console.log('\n=== lemmaMapEs.js ===');
  console.log(`Total forms parsed:     ${total}`);
  console.log(`Self-mappings (skipped): ${selfMaps}`);
  console.log(`Non-identity mappings:   ${Object.keys(map).length}`);
  if (filterCount > 0) {
    console.log(`Filtered out (lemma not in cefrLookupEs): ${filterCount}`);
  }
  console.log(`Final entries written:   ${Object.keys(filtered).length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
