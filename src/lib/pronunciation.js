import { tokenizeReference, alignWords } from './alignment';
import { wavFromBlob } from './audioUtils';
import { cleanToken } from './wordUtils';

const FLAG_THRESHOLD = 60;

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
      const wavBlob = await wavFromBlob(audioBlob);
      const wavPath = `${userId}/${textId}.wav`;
      await supabase.storage
        .from('student-recordings')
        .upload(wavPath, wavBlob, { contentType: 'audio/wav', upsert: true });

      const azureRes = await fetch('/.netlify/functions/assess-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: wavPath, referenceText }),
      });
      azureData = await azureRes.json();
      if (azureData.error) {
        console.warn('Azure PA returned error, continuing with Whisper-only:', azureData.error);
        azureData = null;
      }

      await supabase.storage.from('student-recordings').remove([wavPath]);
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

const PAUSE_THRESHOLD_MS = 1000;

export function buildWordAssessmentMap(assessmentData) {
  const map = new Map();
  const { alignment, azure_word_scores, whisper_word_timestamps } = assessmentData;
  if (!alignment) return map;

  const azureByIdx = new Map();
  if (azure_word_scores?.length) {
    let azIdx = 0;
    for (const entry of alignment) {
      if (azIdx >= azure_word_scores.length) break;
      if (entry.type === 'match' || entry.type === 'substitution') {
        azureByIdx.set(entry.refIdx, azure_word_scores[azIdx]);
        azIdx++;
      }
    }
  }

  const pauseByRefIdx = computePauses(alignment, whisper_word_timestamps);

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

function computePauses(alignment, whisperTimestamps) {
  const pauses = new Map();
  if (!whisperTimestamps?.length) return pauses;

  const timestampBySpokenIdx = new Map();
  for (let i = 0; i < whisperTimestamps.length; i++) {
    const w = whisperTimestamps[i];
    timestampBySpokenIdx.set(i, { start: (w.start || 0) * 1000, end: (w.end || 0) * 1000 });
  }

  const spoken = alignment.filter(e => e.spokenIdx != null && e.refIdx != null);
  for (let i = 1; i < spoken.length; i++) {
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
  const azureByIdx = new Map();

  if (azureData?.words?.length) {
    let azIdx = 0;
    for (const entry of alignment) {
      if (azIdx >= azureData.words.length) break;
      if (entry.type === 'match' || entry.type === 'substitution') {
        azureByIdx.set(entry.refIdx, azureData.words[azIdx]);
        azIdx++;
      }
    }
  }

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
  if (accuracy < 45) return 4;
  if (accuracy < 55) return 3;
  return 2;
}

function computeOverallAccuracy(alignment, azureData) {
  if (azureData?.words?.length) {
    const scores = azureData.words
      .filter(w => w.accuracyScore != null && w.errorType !== 'Insertion')
      .map(w => w.accuracyScore);
    if (scores.length > 0) {
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  const refEntries = alignment.filter(e => e.refIdx != null);
  if (refEntries.length === 0) return 0;
  const matched = refEntries.filter(e => e.type === 'match').length;
  return Math.round((matched / refEntries.length) * 100);
}
