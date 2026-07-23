import { CONTRACTIONS } from './wordUtils';

const WORD_REGEX = /[a-zA-ZÀ-ÿ'''-]+/g;

function normalize(word) {
  return word.toLowerCase().replace(/[^a-zA-ZÀ-ÿ'-]/g, '');
}

function expandToWords(token) {
  const lower = token.toLowerCase();
  const expansion = CONTRACTIONS[lower];
  if (expansion) return expansion.split(' ');
  return [lower];
}

export function tokenizeReference(text) {
  const tokens = [];
  let globalIdx = 0;

  for (const para of text.split(/\n\n+/)) {
    const regex = /([a-zA-ZÀ-ÿ'''-]+)|([^a-zA-ZÀ-ÿ'''-]+)/g;
    let match;
    while ((match = regex.exec(para)) !== null) {
      if (match[1]) {
        tokens.push({ raw: match[1], wordIdx: globalIdx++ });
      }
    }
  }
  return tokens;
}

export function alignWords(referenceTokens, whisperWords) {
  const refExpanded = [];
  for (const tok of referenceTokens) {
    const parts = expandToWords(tok.raw);
    for (const part of parts) {
      refExpanded.push({ word: normalize(part), origIdx: tok.wordIdx });
    }
  }

  const spkExpanded = [];
  for (let i = 0; i < whisperWords.length; i++) {
    const w = whisperWords[i];
    const parts = expandToWords(w.word);
    for (const part of parts) {
      spkExpanded.push({
        word: normalize(part),
        origIdx: i,
        timestampMs: Math.round((w.start || 0) * 1000),
      });
    }
  }

  const n = refExpanded.length;
  const m = spkExpanded.length;

  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (refExpanded[i - 1].word === spkExpanded[j - 1].word) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && refExpanded[i - 1].word === spkExpanded[j - 1].word) {
      ops.push({ type: 'match', ri: i - 1, si: j - 1 });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ type: 'substitution', ri: i - 1, si: j - 1 });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ type: 'omission', ri: i - 1, si: null });
      i--;
    } else {
      ops.push({ type: 'insertion', ri: null, si: j - 1 });
      j--;
    }
  }
  ops.reverse();

  const alignment = [];
  const seen = new Set();

  for (const op of ops) {
    const refIdx = op.ri != null ? refExpanded[op.ri].origIdx : null;
    const spk = op.si != null ? spkExpanded[op.si] : null;

    if (op.type === 'insertion') {
      alignment.push({
        type: 'insertion',
        refWord: null,
        refIdx: null,
        spokenWord: spk.word,
        spokenIdx: spk.origIdx,
        timestampMs: spk.timestampMs,
      });
      continue;
    }

    if (seen.has(refIdx) && op.type !== 'insertion') continue;
    seen.add(refIdx);

    const refTok = referenceTokens.find(t => t.wordIdx === refIdx);

    alignment.push({
      type: op.type,
      refWord: refTok?.raw || refExpanded[op.ri].word,
      refIdx,
      spokenWord: spk?.word || null,
      spokenIdx: spk?.origIdx ?? null,
      timestampMs: spk?.timestampMs ?? null,
    });
  }

  return alignment;
}
