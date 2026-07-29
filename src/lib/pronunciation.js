import { tokenizeReference, alignWords } from './alignment';
import { decodeAudioBlob, encodeWavSlice, detectSentences, wavFromBlob } from './audioUtils';
import { cleanToken } from './wordUtils';

const FLAG_THRESHOLD = 50;
const PAUSE_THRESHOLD_MS = 1000;
const CHUNK_MIN_WORDS = 15;
const AUDIO_BUFFER_SEC = 0.3;
const MIN_PHONEME_INSTANCES = 5;

export async function runPronunciationAssessment({ userId, textId, storagePath, referenceText, audioBlob, supabase }) {
  await supabase
    .from('student_recordings')
    .update({ assessment_status: 'processing', assessment_error: null })
    .eq('user_id', userId)
    .eq('text_id', textId);

  try {
    const whisperRes = await fetch('/.netlify/functions/transcribe-whisper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    });
    const whisperData = await whisperRes.json();
    if (whisperData.error) throw new Error(`Whisper: ${whisperData.error}`);

    const refTokens = tokenizeReference(referenceText);
    const alignment = alignWords(refTokens, whisperData.words || []);

    let azureData = null;
    try {
      const audioBuffer = await decodeAudioBlob(audioBlob);
      const sentences = detectSentences(referenceText, null);
      const chunks = buildSentenceChunks(sentences, refTokens, CHUNK_MIN_WORDS);
      const wordPositions = getWordPositions(referenceText);

      const chunkResults = await Promise.all(chunks.map(async (chunk, idx) => {
        const timeRange = getChunkTimeRange(chunk, alignment, whisperData.words);
        if (!timeRange) return null;

        const wavBlob = encodeWavSlice(audioBuffer, timeRange.startSec, timeRange.endSec);
        if (!wavBlob) return null;

        const chunkPath = `${userId}/${textId}_chunk${idx}.wav`;
        const chunkRefText = extractChunkText(referenceText, wordPositions, chunk.firstWordIdx, chunk.lastWordIdx);

        try {
          await supabase.storage
            .from('student-recordings')
            .upload(chunkPath, wavBlob, { contentType: 'audio/wav', upsert: true });

          const res = await fetch('/.netlify/functions/assess-pronunciation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storagePath: chunkPath, referenceText: chunkRefText }),
          });
          const data = await res.json();

          await supabase.storage.from('student-recordings').remove([chunkPath]);

          if (data.error) {
            console.warn(`Azure PA chunk ${idx} error:`, data.error);
            return null;
          }
          return data;
        } catch (err) {
          console.warn(`Azure PA chunk ${idx} failed:`, err);
          await supabase.storage.from('student-recordings').remove([chunkPath]).catch(() => {});
          return null;
        }
      }));

      const mergedWords = [];
      const fluencyScores = [];
      const prosodyScores = [];
      const completenessScores = [];

      for (const result of chunkResults) {
        if (!result) continue;
        if (result.words?.length) mergedWords.push(...result.words);
        if (result.fluencyScore != null) fluencyScores.push(result.fluencyScore);
        if (result.prosodyScore != null) prosodyScores.push(result.prosodyScore);
        if (result.completenessScore != null) completenessScores.push(result.completenessScore);
      }

      if (mergedWords.length > 0) {
        const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
        azureData = {
          words: mergedWords,
          fluencyScore: avg(fluencyScores),
          prosodyScore: avg(prosodyScores),
          completenessScore: avg(completenessScores),
        };
      }
    } catch (azureErr) {
      console.warn('Azure PA failed, saving Whisper-only results:', azureErr);
    }

    const flags = generateFlagEvents({ userId, textId, alignment, azureData });
    const overallAccuracy = computeOverallAccuracy(alignment, azureData);

    const assessmentRow = {
      user_id: userId,
      text_id: textId,
      whisper_transcript: whisperData.transcript,
      whisper_word_timestamps: whisperData.words,
      alignment,
      azure_word_scores: azureData?.words || null,
      azure_fluency_score: azureData?.fluencyScore ?? null,
      azure_prosody_score: azureData?.prosodyScore ?? null,
      azure_completeness_score: azureData?.completenessScore ?? null,
      overall_accuracy: overallAccuracy,
      processed_at: new Date().toISOString(),
    };

    await supabase
      .from('pronunciation_assessments')
      .upsert(assessmentRow, { onConflict: 'user_id,text_id' });

    await supabase
      .from('flag_events')
      .delete()
      .eq('student_id', userId)
      .eq('text_id', textId)
      .eq('source', 'ai');

    if (flags.length > 0) {
      await supabase.from('flag_events').insert(flags);
    }

    await supabase
      .from('student_recordings')
      .update({ assessment_status: 'complete', assessment_error: null })
      .eq('user_id', userId)
      .eq('text_id', textId);

    return { success: true, assessmentData: assessmentRow };
  } catch (err) {
    await supabase
      .from('student_recordings')
      .update({ assessment_status: 'error', assessment_error: err.message })
      .eq('user_id', userId)
      .eq('text_id', textId);
    return { success: false, error: err.message };
  }
}

function buildSentenceChunks(sentences, refTokens, minWords) {
  if (!sentences.length) {
    const totalWords = refTokens.length;
    return [{ firstWordIdx: 0, lastWordIdx: totalWords - 1, wordCount: totalWords, sentenceIndices: [] }];
  }

  const chunks = [];
  let current = { firstWordIdx: null, lastWordIdx: null, wordCount: 0, sentenceIndices: [] };

  for (const s of sentences) {
    const wordCount = s.lastWordIdx - s.firstWordIdx + 1;
    if (current.firstWordIdx === null) current.firstWordIdx = s.firstWordIdx;
    current.lastWordIdx = s.lastWordIdx;
    current.wordCount += wordCount;
    current.sentenceIndices.push(s.sentenceIdx);

    if (current.wordCount >= minWords) {
      chunks.push(current);
      current = { firstWordIdx: null, lastWordIdx: null, wordCount: 0, sentenceIndices: [] };
    }
  }

  if (current.sentenceIndices.length > 0) {
    if (chunks.length > 0 && current.wordCount < Math.ceil(minWords / 2)) {
      const last = chunks[chunks.length - 1];
      last.lastWordIdx = current.lastWordIdx;
      last.wordCount += current.wordCount;
      last.sentenceIndices.push(...current.sentenceIndices);
    } else {
      chunks.push(current);
    }
  }

  return chunks;
}

export function getWordPositions(text) {
  const positions = [];
  const regex = /[a-zA-ZÀ-ÿ'''-]+/g;
  let match;
  let wordIdx = 0;
  while ((match = regex.exec(text)) !== null) {
    positions.push({ wordIdx: wordIdx++, charStart: match.index, charEnd: match.index + match[0].length });
  }
  return positions;
}

export function extractChunkText(referenceText, wordPositions, firstWordIdx, lastWordIdx) {
  const first = wordPositions.find(p => p.wordIdx === firstWordIdx);
  const nextAfterLast = wordPositions.find(p => p.wordIdx === lastWordIdx + 1);
  if (!first) return referenceText;
  const endPos = nextAfterLast ? nextAfterLast.charStart : referenceText.length;
  return referenceText.substring(first.charStart, endPos).trim();
}

function getChunkTimeRange(chunk, alignment, whisperTimestamps) {
  if (!whisperTimestamps?.length) return null;

  const chunkEntries = alignment.filter(e =>
    e.refIdx != null &&
    e.refIdx >= chunk.firstWordIdx &&
    e.refIdx <= chunk.lastWordIdx &&
    e.spokenIdx != null
  );

  if (chunkEntries.length === 0) return null;

  const spokenIndices = chunkEntries.map(e => e.spokenIdx);
  const minIdx = Math.min(...spokenIndices);
  const maxIdx = Math.max(...spokenIndices);

  const firstTs = whisperTimestamps[minIdx];
  const lastTs = whisperTimestamps[maxIdx];
  if (!firstTs || !lastTs) return null;

  return {
    startSec: Math.max(0, (firstTs.start || 0) - AUDIO_BUFFER_SEC),
    endSec: (lastTs.end || lastTs.start || 0) + AUDIO_BUFFER_SEC,
  };
}

function mapAzureToAlignment(azureWords, alignment) {
  const azureByIdx = new Map();
  if (!azureWords?.length) return azureByIdx;

  const azureRefWords = azureWords.filter(w => w.errorType !== 'Insertion');
  let azIdx = 0;
  for (const entry of alignment) {
    if (entry.refIdx == null) continue;
    if (azIdx >= azureRefWords.length) break;
    azureByIdx.set(entry.refIdx, azureRefWords[azIdx]);
    azIdx++;
  }
  return azureByIdx;
}

export function buildWordAssessmentMap(assessmentData, sentences = null) {
  const map = new Map();
  const { alignment, azure_word_scores, whisper_word_timestamps } = assessmentData;

  if (!alignment && azure_word_scores?.length) {
    const refWords = azure_word_scores.filter(w => w.errorType !== 'Insertion');
    for (let i = 0; i < refWords.length; i++) {
      const w = refWords[i];
      map.set(i, {
        type: w.errorType === 'Omission' ? 'omission'
          : w.errorType === 'Mispronunciation' ? 'substitution' : 'match',
        spokenWord: w.word,
        accuracy: w.accuracyScore ?? 0,
        errorType: w.errorType || 'None',
        phonemes: w.phonemes || [],
        timestampMs: null,
        pauseMs: null,
      });
    }
    return map;
  }

  if (!alignment) return map;

  const azureByIdx = mapAzureToAlignment(azure_word_scores, alignment);
  const pauseByRefIdx = computePauses(alignment, whisper_word_timestamps, sentences);

  for (const entry of alignment) {
    if (entry.refIdx == null) continue;

    const azure = azureByIdx.get(entry.refIdx);
    let accuracy;
    if (azure?.accuracyScore != null) {
      accuracy = azure.accuracyScore;
    } else if (entry.type === 'match') {
      accuracy = 100;
    } else if (entry.type === 'omission') {
      accuracy = 0;
    } else {
      accuracy = 30;
    }

    map.set(entry.refIdx, {
      type: entry.type,
      spokenWord: entry.spokenWord,
      accuracy,
      timestampMs: entry.timestampMs,
      errorType: azure?.errorType || null,
      pauseMs: pauseByRefIdx.get(entry.refIdx) || null,
    });
  }

  return map;
}

function computePauses(alignment, whisperTimestamps, sentences) {
  const pauses = new Map();
  if (!whisperTimestamps?.length) return pauses;

  const sentenceForIdx = new Map();
  if (sentences?.length) {
    for (const s of sentences) {
      for (let w = s.firstWordIdx; w <= s.lastWordIdx; w++) {
        sentenceForIdx.set(w, s.sentenceIdx);
      }
    }
  }

  const timestampBySpokenIdx = new Map();
  for (let i = 0; i < whisperTimestamps.length; i++) {
    const w = whisperTimestamps[i];
    timestampBySpokenIdx.set(i, { start: (w.start || 0) * 1000, end: (w.end || 0) * 1000 });
  }

  const spoken = alignment.filter(e => e.spokenIdx != null && e.refIdx != null);
  for (let i = 1; i < spoken.length; i++) {
    if (sentenceForIdx.size > 0) {
      const prevSent = sentenceForIdx.get(spoken[i - 1].refIdx);
      const currSent = sentenceForIdx.get(spoken[i].refIdx);
      if (prevSent != null && currSent != null && prevSent !== currSent) continue;
    }

    const prev = timestampBySpokenIdx.get(spoken[i - 1].spokenIdx);
    const curr = timestampBySpokenIdx.get(spoken[i].spokenIdx);
    if (!prev || !curr) continue;

    const gap = curr.start - prev.end;
    if (gap >= PAUSE_THRESHOLD_MS) {
      pauses.set(spoken[i].refIdx, Math.round(gap));
    }
  }

  return pauses;
}

function generateFlagEvents({ userId, textId, alignment, azureData }) {
  const flags = [];
  const azureByIdx = mapAzureToAlignment(azureData?.words, alignment);

  for (const entry of alignment) {
    if (entry.refIdx == null) continue;
    if (entry.type === 'match' && !azureByIdx.has(entry.refIdx)) continue;

    const azure = azureByIdx.get(entry.refIdx);
    let flagType = null;
    let severity = null;
    let notes = null;

    if (entry.type === 'omission') {
      flagType = 'skip';
      severity = 3;
      notes = `Word "${entry.refWord}" was skipped`;
    } else if (entry.type === 'substitution') {
      flagType = 'mispronunciation';
      const acc = azure?.accuracyScore;
      severity = acc != null ? accuracyToSeverity(acc) : 3;
      notes = `Said "${entry.spokenWord}" instead of "${entry.refWord}"`;
    } else if (entry.type === 'match' && azure) {
      const acc = azure.accuracyScore;
      if (acc != null && acc < FLAG_THRESHOLD) {
        flagType = 'mispronunciation';
        severity = accuracyToSeverity(acc);
      }
      if (azure.errorType === 'Hesitation') {
        flagType = 'hesitation';
        severity = severity ?? 2;
      }
    }

    if (!flagType) continue;

    flags.push({
      student_id: userId,
      text_id: textId,
      headword: cleanToken(entry.refWord),
      surface_form: entry.refWord,
      word_position: entry.refIdx,
      source: 'ai',
      source_user_id: null,
      flag_type: flagType,
      severity,
      audio_timestamp_ms: entry.timestampMs,
      ai_confidence: azure?.accuracyScore != null ? azure.accuracyScore / 100 : null,
      notes,
    });
  }

  return flags;
}

function accuracyToSeverity(accuracy) {
  if (accuracy < 30) return 5;
  return 4;
}

export async function assessSentencePronunciation({ audioBlob, referenceText, firstWordIdx, lastWordIdx, supabase, userId, textId }) {
  console.log('[shadow-feedback] audioBlob size:', audioBlob.size, 'type:', audioBlob.type);
  console.log('[shadow-feedback] referenceText:', JSON.stringify(referenceText));
  const wavBlob = await wavFromBlob(audioBlob);
  console.log('[shadow-feedback] wavBlob size:', wavBlob.size);
  const tempPath = `${userId}/shadow_${textId}_${Date.now()}.wav`;

  await supabase.storage
    .from('student-recordings')
    .upload(tempPath, wavBlob, { contentType: 'audio/wav', upsert: true });

  try {
    const res = await fetch('/.netlify/functions/assess-pronunciation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath: tempPath, referenceText }),
    });
    const data = await res.json();
    console.log('[shadow-feedback] Azure response:', JSON.stringify(data));
    if (data.error) throw new Error(data.error);

    const map = new Map();
    const azureRefWords = (data.words || []).filter(w => w.errorType !== 'Insertion');
    const totalRefWords = lastWordIdx - firstWordIdx + 1;

    for (let i = 0; i < Math.min(azureRefWords.length, totalRefWords); i++) {
      const w = azureRefWords[i];
      map.set(firstWordIdx + i, {
        type: w.errorType === 'Omission' ? 'omission'
          : w.errorType === 'Mispronunciation' ? 'substitution' : 'match',
        spokenWord: w.word,
        accuracy: w.accuracyScore ?? 0,
        errorType: w.errorType || 'None',
        phonemes: w.phonemes || [],
      });
    }

    const scores = azureRefWords
      .filter(w => w.accuracyScore != null && w.errorType !== 'Omission')
      .map(w => w.accuracyScore);
    const overallAccuracy = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return { map, overallAccuracy };
  } finally {
    await supabase.storage.from('student-recordings').remove([tempPath]).catch(() => {});
  }
}

function computeOverallAccuracy(alignment, azureData) {
  if (azureData?.words?.length) {
    const scores = azureData.words
      .filter(w => w.accuracyScore != null && w.errorType !== 'Insertion' && w.errorType !== 'Omission')
      .map(w => w.accuracyScore);
    if (scores.length > 0) {
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  const attempted = alignment.filter(e => e.refIdx != null && e.type !== 'omission');
  if (attempted.length === 0) return 0;
  const matched = attempted.filter(e => e.type === 'match').length;
  return Math.round((matched / attempted.length) * 100);
}

// --- Phoneme aggregation ---

export function aggregatePhonemes(words) {
  const groups = new Map();
  for (const w of words) {
    if (w.errorType === 'Insertion' || w.errorType === 'Omission') continue;
    for (const p of (w.phonemes || [])) {
      if (p.accuracyScore == null) continue;
      if (!groups.has(p.phoneme)) groups.set(p.phoneme, []);
      groups.get(p.phoneme).push(p.accuracyScore);
    }
  }
  return groups;
}

export function computePhonemeMedians(groups, minInstances = MIN_PHONEME_INSTANCES) {
  const medians = {};
  const counts = {};
  for (const [phoneme, scores] of groups) {
    if (scores.length < minInstances) continue;
    scores.sort((a, b) => a - b);
    const mid = Math.floor(scores.length / 2);
    medians[phoneme] = scores.length % 2 === 0
      ? Math.round((scores[mid - 1] + scores[mid]) / 2)
      : scores[mid];
    counts[phoneme] = scores.length;
  }
  return { medians, counts };
}

export function identifyWeakPhonemes(medians) {
  const entries = Object.entries(medians).sort((a, b) => a[1] - b[1]);
  if (entries.length === 0) return [];
  const quartileSize = Math.max(1, Math.ceil(entries.length / 4));
  return entries.slice(0, quartileSize).map(([phoneme]) => phoneme);
}

// --- Fluency assessment (Whisper + chunked Azure PA) ---

export async function runFluencyAssessment({ userId, textId, referenceText, audioBlob, storagePath, supabase, durationSeconds, onProgress }) {
  await supabase
    .from('student_recordings')
    .update({ assessment_status: 'processing', assessment_error: null })
    .eq('user_id', userId)
    .eq('text_id', textId);

  try {
    if (onProgress) onProgress(0.05);

    const whisperRes = await fetch('/.netlify/functions/transcribe-whisper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    });
    const whisperData = await whisperRes.json();
    if (whisperData.error) throw new Error(`Whisper: ${whisperData.error}`);
    console.log(`[fluency] Whisper: ${(whisperData.words || []).length} words, transcript: "${(whisperData.transcript || '').substring(0, 200)}..."`);
    if (onProgress) onProgress(0.2);

    const refTokens = tokenizeReference(referenceText);
    const alignment = alignWords(refTokens, whisperData.words || []);
    const matchCount = alignment.filter(e => e.type === 'match').length;
    const omitCount = alignment.filter(e => e.type === 'omission').length;
    console.log(`[fluency] Alignment: ${alignment.length} entries (${matchCount} match, ${omitCount} omission), ref tokens: ${refTokens.length}`);

    const audioBuffer = await decodeAudioBlob(audioBlob);
    console.log(`[fluency] Audio decoded: ${audioBuffer.duration.toFixed(1)}s, ${audioBuffer.length} samples`);
    const sentences = detectSentences(referenceText, null);
    const chunks = buildSentenceChunks(sentences, refTokens, CHUNK_MIN_WORDS);
    const wordPositions = getWordPositions(referenceText);
    console.log(`[fluency] ${sentences.length} sentences → ${chunks.length} chunks:`, chunks.map(c => `[${c.firstWordIdx}-${c.lastWordIdx}]`).join(', '));
    if (onProgress) onProgress(0.3);

    const chunkResults = await Promise.all(chunks.map(async (chunk, idx) => {
      const timeRange = getChunkTimeRange(chunk, alignment, whisperData.words);
      if (!timeRange) return null;

      const wavBlob = encodeWavSlice(audioBuffer, timeRange.startSec, timeRange.endSec);
      if (!wavBlob) return null;

      const chunkPath = `${userId}/${textId}_fluency_chunk${idx}.wav`;
      const chunkRefText = extractChunkText(referenceText, wordPositions, chunk.firstWordIdx, chunk.lastWordIdx);

      try {
        const timeRangeStr = `${timeRange.startSec.toFixed(1)}-${timeRange.endSec.toFixed(1)}s`;
        console.log(`[fluency] chunk ${idx}: words ${chunk.firstWordIdx}-${chunk.lastWordIdx}, time ${timeRangeStr}, wav ${wavBlob.size}B, ref "${chunkRefText.substring(0, 60)}..."`);

        await supabase.storage
          .from('student-recordings')
          .upload(chunkPath, wavBlob, { contentType: 'audio/wav', upsert: true });

        const res = await fetch('/.netlify/functions/assess-pronunciation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: chunkPath, referenceText: chunkRefText }),
        });
        const data = await res.json();
        console.log(`[fluency] chunk ${idx} result: ${data.words?.length || 0} words, error: ${data.error || 'none'}`);

        try { await supabase.storage.from('student-recordings').remove([chunkPath]); } catch {}

        if (data.error) return null;
        return data;
      } catch (err) {
        console.warn(`[fluency] chunk ${idx} failed:`, err);
        try { await supabase.storage.from('student-recordings').remove([chunkPath]); } catch {}
        return null;
      }
    }));

    if (onProgress) onProgress(0.8);

    const mergedWords = [];
    const fluencyScores = [];
    const prosodyScores = [];
    const completenessScores = [];

    for (const result of chunkResults) {
      if (!result) continue;
      if (result.words?.length) mergedWords.push(...result.words);
      if (result.fluencyScore != null) fluencyScores.push(result.fluencyScore);
      if (result.prosodyScore != null) prosodyScores.push(result.prosodyScore);
      if (result.completenessScore != null) completenessScores.push(result.completenessScore);
    }

    console.log(`[fluency] Merged: ${mergedWords.length} words from ${chunkResults.filter(Boolean).length}/${chunks.length} chunks`);

    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const azureData = mergedWords.length > 0 ? {
      words: mergedWords,
      fluencyScore: avg(fluencyScores),
      prosodyScore: avg(prosodyScores),
      completenessScore: avg(completenessScores),
    } : null;

    const scoredWords = mergedWords.filter(w => w.accuracyScore != null && w.errorType !== 'Omission' && w.errorType !== 'Insertion');
    const overallAccuracy = scoredWords.length > 0
      ? Math.round(scoredWords.reduce((a, b) => a + b.accuracyScore, 0) / scoredWords.length)
      : 0;

    const assessmentRow = {
      user_id: userId,
      text_id: textId,
      whisper_transcript: whisperData.transcript,
      whisper_word_timestamps: whisperData.words,
      alignment,
      azure_word_scores: azureData?.words || null,
      azure_fluency_score: azureData?.fluencyScore ?? null,
      azure_prosody_score: azureData?.prosodyScore ?? null,
      azure_completeness_score: azureData?.completenessScore ?? null,
      overall_accuracy: overallAccuracy,
      processed_at: new Date().toISOString(),
    };

    await supabase
      .from('pronunciation_assessments')
      .upsert(assessmentRow, { onConflict: 'user_id,text_id' });

    const phonemeGroups = aggregatePhonemes(mergedWords);
    const { medians, counts } = computePhonemeMedians(phonemeGroups);
    const weakPhonemes = identifyWeakPhonemes(medians);

    let phonemeSession = null;
    if (Object.keys(medians).length > 0) {
      const sessionRow = {
        user_id: userId,
        text_id: textId,
        duration_seconds: durationSeconds || null,
        words_assessed: scoredWords.length,
        overall_accuracy: overallAccuracy,
        fluency_score: azureData?.fluencyScore ?? null,
        prosody_score: azureData?.prosodyScore ?? null,
        phoneme_medians: medians,
        phoneme_counts: counts,
        weak_phonemes: weakPhonemes,
      };
      await supabase.from('phoneme_sessions').insert(sessionRow);
      phonemeSession = sessionRow;
    }

    const flags = generateFlagEvents({ userId, textId, alignment, azureData });
    await supabase
      .from('flag_events')
      .delete()
      .eq('student_id', userId)
      .eq('text_id', textId)
      .eq('source', 'ai');

    if (flags.length > 0) {
      await supabase.from('flag_events').insert(flags);
    }

    await supabase
      .from('student_recordings')
      .update({ assessment_status: 'complete', assessment_error: null })
      .eq('user_id', userId)
      .eq('text_id', textId);

    if (onProgress) onProgress(1);

    return { success: true, assessmentData: assessmentRow, phonemeSession };
  } catch (err) {
    await supabase
      .from('student_recordings')
      .update({ assessment_status: 'error', assessment_error: err.message })
      .eq('user_id', userId)
      .eq('text_id', textId);
    return { success: false, error: err.message };
  }
}

export async function getPhonemeSessionsForText(supabase, userId, textId) {
  const { data } = await supabase
    .from('phoneme_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('text_id', textId)
    .order('session_date', { ascending: true });
  return data || [];
}
