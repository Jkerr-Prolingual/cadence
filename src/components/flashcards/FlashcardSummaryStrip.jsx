import { formatRelativeDate } from '../../lib/reportUtils';
import { getUILabel } from '../../lib/locales';

export default function FlashcardSummaryStrip({ allCards, dueCards, l1 }) {
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
      <Stat label={getUILabel('total', l1)} value={total} />
      <Stat label={getUILabel('mastery', l1)} value={`${masteryPct}%`} />
      {overdue > 0 && <Stat label={getUILabel('due', l1)} value={overdue} warn />}
      {lastReview && <Stat label={getUILabel('lastReview', l1)} value={formatRelativeDate(lastReview)} />}
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
