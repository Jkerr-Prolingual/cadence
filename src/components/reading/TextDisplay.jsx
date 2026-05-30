import { useMemo, useCallback } from 'react';
import { lookupCefr, cefrColor, cleanToken } from '../../lib/wordUtils';

const SHOW_CEFR_UNDERLINES = false;

function extractSentence(tokens, targetIdx) {
  let start = targetIdx;
  while (start > 0) {
    const prev = tokens[start - 1];
    if (prev.type === 'punct' && /[.!?]["""]?\s*$/.test(prev.raw)) break;
    start--;
  }
  let end = targetIdx;
  while (end < tokens.length - 1) {
    const cur = tokens[end];
    if (cur.type === 'punct' && /[.!?]["""]?\s*$/.test(cur.raw)) break;
    end++;
  }
  return tokens.slice(start, end + 1).map(t => t.raw).join('').trim();
}

export default function TextDisplay({
  text,
  onWordClick,
  encounters,
  currentWordIdx = -1,
  currentSentenceIdx = -1,
  loopSentenceIdx = null,
  sentences = [],
}) {
  const paragraphs = useMemo(() => {
    if (!text) return [];
    let globalWordIdx = 0;
    return text.split(/\n\n+/).map((para) => {
      const tokens = [];
      const regex = /([a-zA-ZÀ-ÿ'''-]+)|([^a-zA-ZÀ-ÿ'''-]+)/g;
      let match;
      while ((match = regex.exec(para)) !== null) {
        if (match[1]) {
          const raw = match[1];
          const lookup = lookupCefr(raw);
          tokens.push({ type: 'word', raw, ...lookup, wordIdx: globalWordIdx++ });
        } else {
          tokens.push({ type: 'punct', raw: match[2] });
        }
      }
      return tokens;
    });
  }, [text]);

  const wordToSentence = useMemo(() => {
    const map = {};
    for (const s of sentences) {
      for (let i = s.firstWordIdx; i <= s.lastWordIdx; i++) {
        map[i] = s.sentenceIdx;
      }
    }
    return map;
  }, [sentences]);

  const loopWordRange = useMemo(() => {
    if (loopSentenceIdx == null || !sentences.length) return null;
    const s = sentences[loopSentenceIdx];
    if (!s) return null;
    return { first: s.firstWordIdx, last: s.lastWordIdx };
  }, [loopSentenceIdx, sentences]);

  const handleWordClick = useCallback((e, token, pIdx, tIdx) => {
    const rect = e.target.getBoundingClientRect();
    const para = paragraphs[pIdx];
    const sentence = extractSentence(para, tIdx);
    onWordClick({ ...token, sentence }, { x: rect.left, y: rect.bottom + 4 });
  }, [onWordClick, paragraphs]);

  return (
    <div className="leading-7 sm:leading-8 text-base sm:text-lg text-gray-900">
      {paragraphs.map((tokens, pIdx) => (
        <p key={pIdx} className="mb-3 sm:mb-4">
          {tokens.map((token, tIdx) => {
            if (token.type === 'punct') {
              return <span key={tIdx}>{token.raw}</span>;
            }

            const cleaned = cleanToken(token.raw);
            const encounterCount = encounters?.[token.lemma || cleaned] || 0;
            const color = cefrColor(token.cefr);
            const isA1 = token.cefr === 'A1';

            const isInActiveSentence = wordToSentence[token.wordIdx] === currentSentenceIdx && currentSentenceIdx >= 0;
            const isInLoop = loopWordRange
              && token.wordIdx >= loopWordRange.first
              && token.wordIdx <= loopWordRange.last;

            let wordStyle = SHOW_CEFR_UNDERLINES
              ? { borderBottom: isA1 ? 'none' : `2px solid ${color}`, paddingBottom: isA1 ? 0 : '1px' }
              : {};

            if (isInActiveSentence) {
              wordStyle.backgroundColor = 'rgba(217,119,6,0.15)';
              wordStyle.borderRadius = '2px';
            } else if (isInLoop) {
              wordStyle.backgroundColor = 'rgba(217,119,6,0.08)';
              wordStyle.borderRadius = '2px';
            }

            return (
              <span
                key={tIdx}
                data-widx={token.wordIdx}
                {...(sentences[wordToSentence[token.wordIdx]]?.firstWordIdx === token.wordIdx ? { 'data-sidx': wordToSentence[token.wordIdx] } : {})}
                onClick={(e) => handleWordClick(e, token, pIdx, tIdx)}
                className="cursor-pointer hover:bg-gray-100 rounded-sm transition-colors relative inline-block"
                style={wordStyle}
                title={token.cefr ? `${token.cefr} (${token.via})` : 'unclassified'}
              >
                {token.raw}
                {encounterCount > 0 && !isA1 && !isInActiveSentence && (
                  <span
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
