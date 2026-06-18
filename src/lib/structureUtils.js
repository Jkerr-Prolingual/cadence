import { egpLookup } from '../data/egpLookup';

export function findStructures(wordTokens, manifest, particleMap) {
  if (!manifest?.entries) return new Map();

  const structures = Object.entries(manifest.entries)
    .filter(([, entry]) => entry.type === 'structure' && entry.egp_id && entry.instances?.length);

  if (structures.length === 0) return new Map();

  const result = new Map();
  const consumed = new Set();

  for (const [manifestKey, entry] of structures) {
    const egpEntry = egpLookup[entry.egp_id];
    if (!egpEntry) continue;

    for (const instance of entry.instances) {
      const matches = matchInstance(instance, wordTokens, particleMap, consumed);
      for (const match of matches) {
        const group = {
          egp_id: entry.egp_id,
          phrase: instance,
          wordIndices: match.anchorIndices,
          allIndices: match.allIndices,
          note: entry.note || null,
          override_cefr: entry.override_cefr || null,
          manifestKey,
        };
        for (const idx of match.anchorIndices) {
          consumed.add(idx);
          result.set(idx, group);
        }
      }
    }
  }

  return result;
}

function matchInstance(instance, wordTokens, particleMap, consumed) {
  const isGapped = instance.includes(' ... ');
  if (isGapped) {
    return matchGapped(instance, wordTokens, particleMap, consumed);
  }
  return matchContiguous(instance, wordTokens, particleMap, consumed);
}

function matchContiguous(instance, wordTokens, particleMap, consumed) {
  const pattern = instance.toLowerCase().split(/\s+/);
  const matches = [];

  for (let i = 0; i <= wordTokens.length - pattern.length; i++) {
    let ok = true;
    const anchorIndices = [];
    for (let j = 0; j < pattern.length; j++) {
      const tok = wordTokens[i + j];
      const tokWord = tok.raw.toLowerCase().replace(/[^a-zA-ZÀ-ÿ'-]/g, '');
      if (tokWord !== pattern[j]) { ok = false; break; }
      const wIdx = tok.wordIdx;
      if (particleMap.has(wIdx) || consumed.has(wIdx)) { ok = false; break; }
      anchorIndices.push(wIdx);
    }
    if (ok) {
      matches.push({ anchorIndices, allIndices: [...anchorIndices] });
    }
  }

  return matches;
}

function matchGapped(instance, wordTokens, particleMap, consumed) {
  const segments = instance.split(' ... ').map(s => s.toLowerCase().split(/\s+/));
  const matches = [];
  const MAX_GAP = 5;

  for (let i = 0; i < wordTokens.length; i++) {
    const result = matchSegmentsFrom(segments, 0, i, wordTokens, particleMap, consumed, MAX_GAP);
    if (result) {
      matches.push(result);
    }
  }

  return matches;
}

function matchSegmentsFrom(segments, segIdx, tokIdx, wordTokens, particleMap, consumed, maxGap) {
  if (segIdx >= segments.length) return { anchorIndices: [], allIndices: [] };

  const seg = segments[segIdx];
  if (tokIdx + seg.length > wordTokens.length) return null;

  const anchorIndices = [];
  for (let j = 0; j < seg.length; j++) {
    const tok = wordTokens[tokIdx + j];
    const tokWord = tok.raw.toLowerCase().replace(/[^a-zA-ZÀ-ÿ'-]/g, '');
    if (tokWord !== seg[j]) return null;
    const wIdx = tok.wordIdx;
    if (particleMap.has(wIdx) || consumed.has(wIdx)) return null;
    anchorIndices.push(wIdx);
  }

  if (segIdx === segments.length - 1) {
    return { anchorIndices, allIndices: [...anchorIndices] };
  }

  const afterSeg = tokIdx + seg.length;
  for (let gap = 1; gap <= maxGap; gap++) {
    const nextStart = afterSeg + gap;
    if (nextStart >= wordTokens.length) break;
    const rest = matchSegmentsFrom(segments, segIdx + 1, nextStart, wordTokens, particleMap, consumed, maxGap);
    if (rest) {
      const gapIndices = [];
      for (let g = afterSeg; g < nextStart; g++) {
        gapIndices.push(wordTokens[g].wordIdx);
      }
      return {
        anchorIndices: [...anchorIndices, ...rest.anchorIndices],
        allIndices: [...anchorIndices, ...gapIndices, ...rest.allIndices],
      };
    }
  }

  return null;
}
