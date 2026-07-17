import { supabase } from './supabase';

const LEITNER_INTERVALS_MS = {
  1: 0,
  2: 1 * 24 * 60 * 60 * 1000,
  3: 3 * 24 * 60 * 60 * 1000,
  4: 7 * 24 * 60 * 60 * 1000,
  5: 14 * 24 * 60 * 60 * 1000,
};

export async function getAllSrsCards(textId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', user.id);
  if (textId) query = query.eq('text_id', textId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(fromSupabase);
}

export async function getDueSrsCards(textId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', user.id)
    .lte('next_review_date', new Date().toISOString());
  if (textId) query = query.eq('text_id', textId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(fromSupabase);
}

export async function reviewSrsCard(word, response) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('word', word)
    .single();
  if (!row) return null;

  const card = fromSupabase(row);
  const boxBefore = card.box;
  let newBox;
  if (response === 5) newBox = Math.min(boxBefore + 2, 5);
  else if (response === 4) newBox = Math.min(boxBefore + 1, 5);
  else if (response === 3) newBox = boxBefore;
  else if (response === 2) newBox = 2;
  else newBox = 1;

  const now = Date.now();
  const { error } = await supabase
    .from('srs_cards')
    .update({
      leitner_box: newBox,
      consecutive_correct: response >= 3 ? (card.consecutiveCorrect || 0) + 1 : 0,
      last_review_date: new Date(now).toISOString(),
      next_review_date: new Date(now + LEITNER_INTERVALS_MS[newBox]).toISOString(),
    })
    .eq('id', row.id);
  if (error) throw error;

  const updated = {
    ...card,
    box: newBox,
    consecutiveCorrect: response >= 3 ? (card.consecutiveCorrect || 0) + 1 : 0,
    lastReviewDate: now,
    nextReviewDate: now + LEITNER_INTERVALS_MS[newBox],
  };

  return { card: updated, boxBefore, boxAfter: newBox };
}

export async function logReviewEvent({ word, response, boxBefore, boxAfter }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('review_log').insert({
    user_id: user.id,
    word,
    response,
    correct: response >= 3,
    box_before: boxBefore,
    box_after: boxAfter,
  });
}

export async function upsertSrsCard(cardData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const now = Date.now();
  const row = {
    user_id: user.id,
    word: cardData.word,
    front: cardData.front,
    back: cardData.back,
    card_type: cardData.cardType,
    cefr: cardData.cefr,
    translation: cardData.translation || cardData.spanish || null,
    l1: cardData.l1 || 'es',
    image_url: cardData.imageUrl || null,
    image_attribution: cardData.imageAttribution || null,
    text_id: cardData.textId || null,
    text_title: cardData.textTitle || null,
    leitner_box: cardData.box || 1,
    next_review_date: new Date(cardData.nextReviewDate || now).toISOString(),
    added_date: new Date(cardData.createdAt || now).toISOString(),
  };

  const { error } = await supabase
    .from('srs_cards')
    .upsert(row, { onConflict: 'user_id,word' });
  if (error) throw error;
}

function fromSupabase(row) {
  return {
    id: row.id,
    word: row.word,
    front: row.front,
    back: row.back,
    cardType: row.card_type,
    cefr: row.cefr,
    translation: row.translation || row.spanish || null,
    l1: row.l1 || 'es',
    imageUrl: row.image_url,
    imageAttribution: row.image_attribution,
    textId: row.text_id,
    textTitle: row.text_title,
    box: row.leitner_box,
    consecutiveCorrect: row.consecutive_correct,
    nextReviewDate: row.next_review_date ? new Date(row.next_review_date).getTime() : Date.now(),
    lastReviewDate: row.last_review_date ? new Date(row.last_review_date).getTime() : null,
    createdAt: row.added_date ? new Date(row.added_date).getTime() : Date.now(),
  };
}
