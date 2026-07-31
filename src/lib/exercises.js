export function resolveLocale(value, l1) {
  if (value == null) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value[l1] || value.es || Object.values(value)[0] || '';
  }
  return value;
}

export function resolveProbeLocale(probe, l1) {
  const resolved = { ...probe };
  resolved.question = resolveLocale(probe.question, l1);
  resolved.correct = resolveLocale(probe.correct, l1);
  if (Array.isArray(probe.distractors)) {
    resolved.distractors = probe.distractors.map(d => resolveLocale(d, l1));
  } else if (probe.distractors && typeof probe.distractors === 'object') {
    const localeDistractors = probe.distractors[l1] || probe.distractors.es || Object.values(probe.distractors)[0];
    resolved.distractors = Array.isArray(localeDistractors) ? localeDistractors : [];
  }
  return resolved;
}

export function getBookProbesForText(books, text, l1) {
  if (!text?.book_id) return [];
  const book = books.find(b => b.id === text.book_id);
  if (!book?.exercises?.chapters) return [];
  const chapterKey = `ch${String((text.chapter_order ?? 0) + 1).padStart(2, '0')}`;
  const probes = book.exercises.chapters[chapterKey];
  if (!Array.isArray(probes) || probes.length === 0) return [];
  return probes.map(p => resolveProbeLocale(p, l1));
}
