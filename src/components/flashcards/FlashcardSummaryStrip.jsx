import { formatRelativeDate } from '../../lib/reportUtils';

export default function FlashcardSummaryStrip({ allCards, dueCards }) {
  const total = allCards.length;
  if (total === 0) return null;

  const mastered = allCards.filter(c => (c.box || 1) >= 4).length;
  const masteryPct = Math.round((mastered / total) * 100);
  const overdue = dueCards.length;

  const lastReview = allCards.reduce((latest, c) => {
    if (!c.lastReviewDate) return latest;
    return !latest || c.lastReviewDate > latest ? c.lastReviewDate : latest;
  }, null);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-5">
      <Stat label="Total" value={total} />
      <Stat label="Mastery" value={`${masteryPct}%`} />
      {overdue > 0 && <Stat label="Due" value={overdue} warn />}
      {lastReview && <Stat label="Last review" value={formatRelativeDate(lastReview)} />}
    </div>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${warn ? 'text-amber-600' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}
