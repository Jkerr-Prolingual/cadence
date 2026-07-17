import { useMemo, useCallback } from 'react';
import { lookupCefr, cefrColor, cleanToken } from '../../lib/wordUtils';
import { findParticles } from '../../lib/particleUtils';
import { findStructures } from '../../lib/structureUtils';
import { egpLookup } from '../../data/egpLookup';
import { getGlossTranslation } from '../../lib/translations';

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
  manifest = null,
  showStructures = false,
  syntaxGlosses = null,
  translationMode = false,
  images = [],
  l1 = 'es',
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

  const glossMap = useMemo(() => {
    if (!syntaxGlosses || !translationMode) return new Map();
    const allWords = [];
    for (const tokens of paragraphs) {
      for (const t of tokens) {
        if (t.type === 'word') allWords.push(t);
      }
    }
    if (allWords.length === 0) return new Map();

    const map = new Map();
    let searchFrom = 0;

    for (const gloss of syntaxGlosses) {
      const glossWords = gloss.text.match(/[a-zA-ZÀ-ÿ'''-]+/g);
      if (!glossWords || glossWords.length === 0) continue;

      let matchStart = -1;
      for (let i = searchFrom; i <= allWords.length - glossWords.length; i++) {
        let matched = true;
        for (let j = 0; j < glossWords.length; j++) {
          if (allWords[i + j].raw.toLowerCase() !== glossWords[j].toLowerCase()) {
            matched = false;
            break;
          }
        }
        if (matched) {
          matchStart = i;
          break;
        }
      }

      if (matchStart >= 0) {
        const firstIdx = allWords[matchStart].wordIdx;
        const lastIdx = allWords[matchStart + glossWords.length - 1].wordIdx;
        const entry = { gloss, firstWordIdx: firstIdx, lastWordIdx: lastIdx };
        for (let i = matchStart; i < matchStart + glossWords.length; i++) {
          map.set(allWords[i].wordIdx, entry);
        }
        searchFrom = matchStart + glossWords.length;
      }
    }
    return map;
  }, [paragraphs, syntaxGlosses, translationMode]);

  const particleMap = useMemo(() => {
    const all = new Map();
    for (const tokens of paragraphs) {
      const wordTokens = tokens.filter(t => t.type === 'word');
      const pMap = findParticles(wordTokens, manifest);
      for (const [idx, group] of pMap) {
        all.set(idx, group);
      }
    }
    return all;
  }, [paragraphs, manifest]);

  const structureMap = useMemo(() => {
    if (!showStructures) return new Map();
    const all = new Map();
    for (const tokens of paragraphs) {
      const wordTokens = tokens.filter(t => t.type === 'word');
      const sMap = findStructures(wordTokens, manifest, particleMap);
      for (const [idx, group] of sMap) {
        all.set(idx, group);
      }
    }
    return all;
  }, [paragraphs, manifest, particleMap, showStructures]);

  const wordsByIdx = useMemo(() => {
    const map = {};
    for (const tokens of paragraphs) {
      for (const t of tokens) {
        if (t.type === 'word') map[t.wordIdx] = t;
      }
    }
    return map;
  }, [paragraphs]);

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

  const imagesByPosition = useMemo(() => {
    if (!images?.length) return {};
    const map = {};
    for (const img of images) {
      (map[img.afterParagraph] ??= []).push(img);
    }
    return map;
  }, [images]);

  const handleWordClick = useCallback((e, token, pIdx, tIdx) => {
    const rect = e.target.getBoundingClientRect();
    const para = paragraphs[pIdx];
    const sentence = extractSentence(para, tIdx);
    const particleGroup = particleMap.get(token.wordIdx);
    let particle = null;
    if (particleGroup) {
      particle = {
        ...particleGroup,
        constituents: particleGroup.wordIndices
          .map(idx => wordsByIdx[idx])
          .filter(Boolean),
      };
    }
    const structureGroup = structureMap.get(token.wordIdx);
    let structure = null;
    if (structureGroup) {
      const egp = egpLookup[structureGroup.egp_id];
      structure = { ...structureGroup, egp: egp || null };
    }
    const glossEntry = glossMap.get(token.wordIdx);
    const syntaxGloss = glossEntry ? glossEntry.gloss : null;
    onWordClick({ ...token, sentence, particle, structure, syntaxGloss }, { x: rect.left, y: rect.bottom + 4 });
  }, [onWordClick, paragraphs, particleMap, structureMap, glossMap, wordsByIdx]);

  const sentenceGroups = useMemo(() => {
    return paragraphs.map(tokens => {
      const groups = [];
      let current = { sentenceIdx: null, tokens: [] };

      for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
        const token = tokens[tIdx];
        const sIdx = token.type === 'word' ? (wordToSentence[token.wordIdx] ?? null) : null;

        if (token.type === 'word' && sIdx !== current.sentenceIdx) {
          if (current.tokens.length > 0) groups.push(current);
          current = { sentenceIdx: sIdx, tokens: [{ ...token, tIdx }] };
        } else {
          current.tokens.push({ ...token, tIdx });
        }
      }
      if (current.tokens.length > 0) groups.push(current);
      return groups;
    });
  }, [paragraphs, wordToSentence]);

  const markStyle = {
    backgroundColor: 'rgba(217,119,6,0.15)',
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
    borderRadius: '3px',
    padding: '2px 0',
  };
  const loopMarkStyle = {
    backgroundColor: 'rgba(217,119,6,0.08)',
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
    borderRadius: '3px',
    padding: '2px 0',
  };

  return (
    <div className="leading-7 sm:leading-8 text-base sm:text-lg text-gray-900">
      {sentenceGroups.flatMap((groups, pIdx) => {
        const elements = [];
        if (pIdx === 0 && imagesByPosition[-1]) {
          imagesByPosition[-1].forEach((img, i) => {
            elements.push(
              <figure key={`img-pre-${i}`} className="my-6 flex justify-center">
                <img src={img.publicUrl} alt={img.alt} className="rounded-lg max-w-full h-auto" />
              </figure>
            );
          });
        }
        elements.push(
          <p key={pIdx} className="mb-3 sm:mb-4">
          {groups.map((group, gIdx) => {
            const isActive = group.sentenceIdx === currentSentenceIdx && currentSentenceIdx >= 0;
            const isLoop = !isActive && loopWordRange && group.sentenceIdx != null
              && sentences[group.sentenceIdx]
              && sentences[group.sentenceIdx].firstWordIdx >= loopWordRange.first
              && sentences[group.sentenceIdx].lastWordIdx <= loopWordRange.last;

            const wrapStyle = isActive ? markStyle : isLoop ? loopMarkStyle : null;

            const renderWord = (token, inParticle, inGloss) => {
              const cleaned = cleanToken(token.raw);
              const encounterCount = encounters?.[token.lemma || cleaned] || 0;
              const color = cefrColor(token.cefr);
              const isA1 = token.cefr === 'A1';

              let wordStyle = !inParticle && SHOW_CEFR_UNDERLINES
                ? { borderBottom: isA1 ? 'none' : `2px solid ${color}`, paddingBottom: isA1 ? 0 : '1px' }
                : {};

              return (
                <span
                  key={token.tIdx}
                  data-widx={token.wordIdx}
                  {...(sentences[wordToSentence[token.wordIdx]]?.firstWordIdx === token.wordIdx ? { 'data-sidx': wordToSentence[token.wordIdx] } : {})}
                  onClick={(e) => handleWordClick(e, token, pIdx, token.tIdx)}
                  className={`cursor-pointer hover:bg-gray-100 rounded-sm transition-colors ${inGloss ? 'relative' : 'relative inline-block'}`}
                  style={wordStyle}
                  title={token.cefr ? `${token.cefr} (${token.via})` : 'unclassified'}
                >
                  {token.raw}
                  {false && encounterCount > 0 && !isA1 && !isActive && (
                    <span
                      className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </span>
              );
            };

            const inner = [];
            let glossBuffer = [];
            let activeGlossEntry = null;

            function flushGloss() {
              if (glossBuffer.length === 0) return;
              const g = activeGlossEntry;
              const isComplex = g.gloss.complexity === 'complex';
              inner.push(
                <span
                  key={`g-${g.firstWordIdx}`}
                  className="rounded-sm"
                  style={{
                    borderBottom: `2px solid ${isComplex ? '#3b82f6' : '#93c5fd'}`,
                    paddingBottom: '1px',
                  }}
                  title={getGlossTranslation(g.gloss, l1)}
                >
                  {glossBuffer}
                </span>
              );
              glossBuffer = [];
              activeGlossEntry = null;
            }

            function pushElement(el, wordIdx) {
              const entry = wordIdx != null ? glossMap.get(wordIdx) : null;
              if (entry) {
                if (activeGlossEntry && activeGlossEntry !== entry) flushGloss();
                activeGlossEntry = entry;
                glossBuffer.push(el);
              } else if (activeGlossEntry && wordIdx == null) {
                glossBuffer.push(el);
              } else {
                flushGloss();
                inner.push(el);
              }
            }

            let ti = 0;
            while (ti < group.tokens.length) {
              const token = group.tokens[ti];
              if (token.type === 'punct') {
                pushElement(<span key={token.tIdx}>{token.raw}</span>, null);
                ti++;
                continue;
              }

              const pg = particleMap.get(token.wordIdx);
              if (pg && token.wordIdx === pg.wordIndices[0]) {
                const remaining = new Set(pg.wordIndices);
                const run = [];
                while (ti < group.tokens.length && remaining.size > 0) {
                  const t = group.tokens[ti];
                  if (t.type === 'word' && remaining.has(t.wordIdx)) {
                    run.push(t);
                    remaining.delete(t.wordIdx);
                    ti++;
                  } else if (t.type === 'punct') {
                    run.push(t);
                    ti++;
                  } else {
                    break;
                  }
                }
                if (showStructures) {
                  const pColor = cefrColor(pg.cefr);
                  const inGloss = glossMap.has(pg.wordIndices[0]);
                  const particleEl = (
                    <span
                      key={`p-${pg.wordIndices[0]}`}
                      className="rounded-sm"
                      style={{ borderBottom: `2px dashed ${pColor}`, paddingBottom: '1px' }}
                    >
                      {run.map(t =>
                        t.type === 'punct'
                          ? <span key={t.tIdx}>{t.raw}</span>
                          : renderWord(t, true, inGloss)
                      )}
                    </span>
                  );
                  pushElement(particleEl, pg.wordIndices[0]);
                } else {
                  for (const t of run) {
                    if (t.type === 'punct') {
                      pushElement(<span key={t.tIdx}>{t.raw}</span>, null);
                    } else {
                      pushElement(renderWord(t, false, glossMap.has(t.wordIdx)), t.wordIdx);
                    }
                  }
                }
              } else if (showStructures && structureMap.has(token.wordIdx)) {
                const sg = structureMap.get(token.wordIdx);
                const sLevel = sg.override_cefr || egpLookup[sg.egp_id]?.level;
                const sColor = cefrColor(sLevel);
                const inGloss = glossMap.has(token.wordIdx);
                const structEl = (
                  <span
                    key={`s-${token.wordIdx}`}
                    className="rounded-sm"
                    style={{ borderBottom: `2px dotted ${sColor}`, paddingBottom: '1px' }}
                    data-egp={sg.egp_id}
                  >
                    {renderWord(token, true, inGloss)}
                  </span>
                );
                pushElement(structEl, token.wordIdx);
                ti++;
              } else {
                pushElement(renderWord(token, false, glossMap.has(token.wordIdx)), token.wordIdx);
                ti++;
              }
            }
            flushGloss();

            if (wrapStyle) {
              return <mark key={gIdx} style={wrapStyle}>{inner}</mark>;
            }
            return <span key={gIdx}>{inner}</span>;
          })}
          </p>
        );
        if (imagesByPosition[pIdx]) {
          imagesByPosition[pIdx].forEach((img, i) => {
            elements.push(
              <figure key={`img-${pIdx}-${i}`} className="my-6 flex justify-center">
                <img src={img.publicUrl} alt={img.alt} className="rounded-lg max-w-full h-auto" />
              </figure>
            );
          });
        }
        return elements;
      })}
    </div>
  );
}
