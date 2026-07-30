export function accuracyColor(score) {
  if (score >= 85) return '#7e22ce';
  if (score >= 70) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  if (score >= 30) return '#ea580c';
  return '#dc2626';
}

export function accuracyBg(score) {
  if (score >= 85) return '#faf5ff';
  if (score >= 70) return '#f0fdf4';
  if (score >= 50) return '#fefce8';
  if (score >= 30) return '#fff7ed';
  return '#fef2f2';
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export function groupTextsByBook(texts, books) {
  const bookMap = {};
  for (const b of books) bookMap[b.id] = b.title;

  const byBook = {};
  const standalone = [];
  for (const t of texts) {
    if (t.book_id && bookMap[t.book_id]) {
      if (!byBook[t.book_id]) byBook[t.book_id] = [];
      byBook[t.book_id].push(t);
    } else {
      standalone.push(t);
    }
  }
  for (const id of Object.keys(byBook)) {
    byBook[id].sort((a, b) => (a.chapter_order ?? 0) - (b.chapter_order ?? 0));
  }
  return { byBook, standalone, bookMap };
}
