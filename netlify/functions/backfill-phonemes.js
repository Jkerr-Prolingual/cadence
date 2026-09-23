import { createClient } from '@supabase/supabase-js';

const MIN_PHONEME_INSTANCES = 5;

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Repair existing rows with object-shaped weak_phonemes
  let repaired = 0;
  const { data: allSessions } = await supabase.from('phoneme_sessions').select('id, weak_phonemes');
  for (const ps of (allSessions || [])) {
    if (Array.isArray(ps.weak_phonemes) && ps.weak_phonemes.length > 0 && typeof ps.weak_phonemes[0] === 'object') {
      const fixed = ps.weak_phonemes.map(p => p.phoneme || p);
      await supabase.from('phoneme_sessions').update({ weak_phonemes: fixed }).eq('id', ps.id);
      repaired++;
    }
  }

  const { data: assessments, error } = await supabase
    .from('pronunciation_assessments')
    .select('user_id, text_id, azure_word_scores, overall_accuracy, azure_fluency_score, azure_prosody_score, whisper_word_timestamps, processed_at');
  if (error) return Response.json({ error: error.message, created: 0, skipped: 0, repaired, details: [] });

  let created = 0;
  let skipped = 0;
  const details = [];

  for (const a of assessments) {
    const { data: existing } = await supabase
      .from('phoneme_sessions')
      .select('id')
      .eq('user_id', a.user_id)
      .eq('text_id', a.text_id)
      .limit(1);
    if (existing?.length) {
      details.push({ text_id: a.text_id, user_id: a.user_id, status: 'skipped: already exists' });
      skipped++;
      continue;
    }

    const words = a.azure_word_scores || [];
    if (!words.length) {
      details.push({ text_id: a.text_id, user_id: a.user_id, status: 'skipped: no azure_word_scores' });
      skipped++;
      continue;
    }

    const hasPhonemes = words.some(w => w.phonemes?.length > 0);
    if (!hasPhonemes) {
      details.push({ text_id: a.text_id, user_id: a.user_id, status: `skipped: ${words.length} words but no phoneme data` });
      skipped++;
      continue;
    }

    const phonemeGroups = new Map();
    for (const w of words) {
      if (w.errorType === 'Insertion' || w.errorType === 'Omission') continue;
      for (const p of (w.phonemes || [])) {
        if (p.accuracyScore == null) continue;
        if (!phonemeGroups.has(p.phoneme)) phonemeGroups.set(p.phoneme, []);
        phonemeGroups.get(p.phoneme).push(p.accuracyScore);
      }
    }

    const medians = {};
    const counts = {};
    for (const [phoneme, scores] of phonemeGroups) {
      if (scores.length < MIN_PHONEME_INSTANCES) continue;
      scores.sort((a, b) => a - b);
      const mid = Math.floor(scores.length / 2);
      medians[phoneme] = scores.length % 2 === 0
        ? Math.round((scores[mid - 1] + scores[mid]) / 2)
        : scores[mid];
      counts[phoneme] = scores.length;
    }

    if (!Object.keys(medians).length) {
      details.push({ text_id: a.text_id, user_id: a.user_id, status: `skipped: phonemes found but none met min instances (${MIN_PHONEME_INSTANCES})` });
      skipped++;
      continue;
    }

    const sortedEntries = Object.entries(medians).sort((a, b) => a[1] - b[1]);
    const quartileSize = Math.max(1, Math.ceil(sortedEntries.length / 4));
    const weakPhonemes = sortedEntries.slice(0, quartileSize).map(([phoneme]) => phoneme);

    // Compute confusions from NBest data
    const pairData = {};
    for (const w of words) {
      if (w.errorType === 'Insertion' || w.errorType === 'Omission') continue;
      for (const p of (w.phonemes || [])) {
        const nBest = p.nBestPhonemes;
        if (!nBest || nBest.length < 2) continue;
        const expected = p.phoneme;
        const expectedEntry = nBest.find(nb => nb.phoneme === expected);
        const expectedScore = expectedEntry?.score ?? 0;
        const topAlt = nBest.filter(nb => nb.phoneme !== expected).sort((a, b) => b.score - a.score)[0];
        if (!topAlt) continue;
        const key = `${expected}:${topAlt.phoneme}`;
        if (!pairData[key]) pairData[key] = { expected, alternate: topAlt.phoneme, expectedScores: [], alternateScores: [] };
        pairData[key].expectedScores.push(expectedScore);
        pairData[key].alternateScores.push(topAlt.score);
      }
    }
    const confusions = {};
    for (const [key, data] of Object.entries(pairData)) {
      if (data.expectedScores.length < MIN_PHONEME_INSTANCES) continue;
      const avgExpected = Math.round(data.expectedScores.reduce((a, b) => a + b, 0) / data.expectedScores.length);
      const avgAlternate = Math.round(data.alternateScores.reduce((a, b) => a + b, 0) / data.alternateScores.length);
      confusions[key] = {
        expected: data.expected,
        alternate: data.alternate,
        expectedConfidence: avgExpected,
        alternateConfidence: avgAlternate,
        gap: avgAlternate - avgExpected,
        instances: data.expectedScores.length,
      };
    }

    let durationSec = 0;
    const timestamps = a.whisper_word_timestamps || [];
    if (timestamps.length >= 2) {
      const starts = timestamps.map(t => t.start).filter(t => t != null);
      const ends = timestamps.map(t => t.end).filter(t => t != null);
      if (starts.length && ends.length) {
        durationSec = Math.round(Math.max(...ends) - Math.min(...starts));
      }
    }

    const scoredWords = words.filter(w => w.accuracyScore != null && w.errorType !== 'Omission' && w.errorType !== 'Insertion');
    const row = {
      user_id: a.user_id,
      text_id: a.text_id,
      session_date: a.processed_at || new Date().toISOString(),
      duration_seconds: durationSec,
      words_assessed: scoredWords.length,
      overall_accuracy: a.overall_accuracy,
      fluency_score: a.azure_fluency_score,
      prosody_score: a.azure_prosody_score,
      phoneme_medians: medians,
      phoneme_counts: counts,
      weak_phonemes: weakPhonemes,
    };
    if (Object.keys(confusions).length) row.phoneme_confusions = confusions;

    const { error: insertErr } = await supabase.from('phoneme_sessions').insert(row);
    if (insertErr) {
      details.push({ text_id: a.text_id, user_id: a.user_id, status: `insert failed: ${insertErr.message}` });
    } else {
      details.push({ text_id: a.text_id, user_id: a.user_id, status: 'created' });
      created++;
    }
  }

  return Response.json({ total: assessments.length, created, skipped, repaired, details });
};
