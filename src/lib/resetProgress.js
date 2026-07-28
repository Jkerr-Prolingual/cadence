import { getDB, dbGetAll } from './db';
import { supabase } from './supabase';

async function clearStore(storeName, filterFn) {
  const db = await getDB();
  const all = await dbGetAll(storeName);
  const toDelete = filterFn ? all.filter(filterFn) : all;
  if (toDelete.length === 0) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of toDelete) {
      const key = item[store.keyPath] ?? item.id;
      if (key != null) store.delete(key);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearEntireStore(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetChapterProgress(userId, textId) {
  const byText = (item) => item.textId === textId;

  await Promise.all([
    clearStore('encounters', byText),
    clearStore('readingSessions', byText),
    clearStore('flagEvents', (item) => item.textId === textId && item.source === 'student'),
    clearStore('fluencySessions', byText),
    supabase.from('encounters').delete().eq('user_id', userId).eq('text_id', textId),
    supabase.from('reading_sessions').delete().eq('user_id', userId).eq('text_id', textId),
    supabase.from('flag_events').delete().eq('user_id', userId).eq('text_id', textId).eq('source', 'student'),
    supabase.from('fluency_sessions').delete().eq('user_id', userId).eq('text_id', textId),
  ]);
}

export async function resetChapterRecording(userId, textId) {
  const { data: rec } = await supabase
    .from('student_recordings')
    .select('storage_path')
    .eq('user_id', userId)
    .eq('text_id', textId)
    .maybeSingle();

  await Promise.all([
    clearStore('recordings', (item) => item.textId === textId),
    supabase.from('pronunciation_assessments').delete().eq('user_id', userId).eq('text_id', textId),
    supabase.from('flag_events').delete().eq('user_id', userId).eq('text_id', textId).eq('source', 'ai'),
    supabase.from('student_recordings').delete().eq('user_id', userId).eq('text_id', textId),
  ]);

  if (rec?.storage_path) {
    await supabase.storage.from('student-recordings').remove([rec.storage_path]);
  }
}

export async function resetChapterWpm(userId, textId) {
  await Promise.all([
    clearStore('fluencySessions', (item) => item.textId === textId),
    supabase.from('fluency_sessions').delete().eq('user_id', userId).eq('text_id', textId),
  ]);
}

export async function resetAllProgress(userId) {
  await Promise.all([
    clearEntireStore('encounters'),
    clearEntireStore('readingSessions'),
    clearEntireStore('flagEvents'),
    clearEntireStore('fluencySessions'),
    clearEntireStore('recordings'),
    clearEntireStore('srsCards'),
    clearEntireStore('reviewLog'),
    supabase.from('encounters').delete().eq('user_id', userId),
    supabase.from('reading_sessions').delete().eq('user_id', userId),
    supabase.from('flag_events').delete().eq('user_id', userId).eq('source', 'student'),
    supabase.from('fluency_sessions').delete().eq('user_id', userId),
    supabase.from('pronunciation_assessments').delete().eq('user_id', userId),
    supabase.from('phoneme_sessions').delete().eq('user_id', userId),
    supabase.from('srs_cards').delete().eq('user_id', userId),
    supabase.from('srs_card_sources').delete().eq('user_id', userId),
  ]);

  const { data: recs } = await supabase
    .from('student_recordings')
    .select('storage_path')
    .eq('user_id', userId);

  if (recs?.length) {
    await supabase.storage.from('student-recordings').remove(recs.map(r => r.storage_path));
  }

  await supabase.from('student_recordings').delete().eq('user_id', userId);
}
