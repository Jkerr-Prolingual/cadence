import { dbAdd, dbGetAll } from './db';
import { supabase } from './supabase';

export async function logFluencySession({ userId, textId, wordCount, elapsedSeconds }) {
  const existing = await getFluencySessionsForText(textId);
  const passNumber = existing.length + 1;
  const wpm = elapsedSeconds > 0 ? Math.round((wordCount / elapsedSeconds) * 60) : 0;

  const record = {
    id: crypto.randomUUID(),
    userId,
    textId,
    passNumber,
    wordCount,
    elapsedSeconds,
    wpm,
    sessionDate: new Date().toISOString(),
  };

  await dbAdd('fluencySessions', record);

  if (userId) {
    try {
      await supabase.from('fluency_sessions').insert({
        id: record.id,
        user_id: userId,
        text_id: textId,
        pass_number: passNumber,
        word_count: wordCount,
        elapsed_seconds: elapsedSeconds,
        wpm,
        session_date: record.sessionDate,
      });
    } catch {}
  }

  return record;
}

export async function getFluencySessionsForText(textId) {
  const all = await dbGetAll('fluencySessions');
  return all
    .filter(s => s.textId === textId)
    .sort((a, b) => a.passNumber - b.passNumber);
}
