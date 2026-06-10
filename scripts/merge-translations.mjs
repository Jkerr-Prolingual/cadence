/**
 * Merge new Spanish translations into es_dictionary.js.
 *
 * Input: a JSON file mapping English words to Spanish translations.
 * Accepts two formats:
 *
 *   Flat:     { "apple": "manzana", "airport": "aeropuerto", ... }
 *
 *   Grouped:  { "A1": { "apple": "manzana" }, "A2": { ... }, ... }
 *             (CEFR groups are flattened automatically)
 *
 * Usage: node scripts/merge-translations.mjs <input.json>
 *
 * The script merges new entries into the existing dictionary without
 * overwriting existing translations. To force-overwrite, pass --overwrite.
 */

import { readFileSync, writeFileSync } from 'fs';

const args = process.argv.slice(2);
const overwrite = args.includes('--overwrite');
const inputFile = args.find(a => !a.startsWith('--'));

if (!inputFile) {
  console.error('Usage: node scripts/merge-translations.mjs <input.json> [--overwrite]');
  process.exit(1);
}

const raw = readFileSync('src/data/es_dictionary.js', 'utf-8');
const match = raw.match(/\{[\s\S]+\}/);
if (!match) {
  console.error('Could not parse es_dictionary.js');
  process.exit(1);
}
const existing = new Function(`return ${match[0]}`)();

const input = JSON.parse(readFileSync(inputFile, 'utf-8'));

let newEntries = {};
if (input.A1 || input.A2 || input.B1 || input.B2 || input.C1) {
  for (const level of Object.values(input)) {
    if (typeof level === 'object' && !Array.isArray(level)) {
      Object.assign(newEntries, level);
    }
  }
} else {
  newEntries = input;
}

let added = 0;
let overwritten = 0;
let skipped = 0;

for (const [word, translation] of Object.entries(newEntries)) {
  const key = word.toLowerCase().trim();
  if (!translation || typeof translation !== 'string') continue;

  if (existing[key]) {
    if (overwrite) {
      existing[key] = translation.trim();
      overwritten++;
    } else {
      skipped++;
    }
  } else {
    existing[key] = translation.trim();
    added++;
  }
}

const sorted = Object.entries(existing).sort((a, b) => a[0].localeCompare(b[0]));

const lines = [
  '// English -> Spanish dictionary (EFLLex + NGSL + AWL)',
  `// Generated: ${new Date().toISOString().slice(0, 10)}`,
  `// ${sorted.length} entries`,
  'export const spanishDict = {',
];

for (const [word, translation] of sorted) {
  lines.push(`  ${JSON.stringify(word)}: ${JSON.stringify(translation)},`);
}
lines.push('};');
lines.push('');

writeFileSync('src/data/es_dictionary.js', lines.join('\n'), 'utf-8');

console.log(`Merged into es_dictionary.js:`);
console.log(`  Added:       ${added}`);
if (overwrite) console.log(`  Overwritten: ${overwritten}`);
console.log(`  Skipped:     ${skipped} (already existed)`);
console.log(`  Total:       ${sorted.length} entries`);
