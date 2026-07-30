import { formatRelativeDate } from '../../lib/reportUtils';
import BookReportCard from './BookReportCard';
import LeitnerMiniBar from './LeitnerMiniBar';

export default function StudentReportCard({ report, onSelectChapter }) {
  if (!report) return null;

  const { global, books } = report;

  return (
    <div className="space-y-6">
      {/* Global header strip */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Metric label="Books" value={global.booksCompleted} />
          <Metric label="Cards" value={`${global.totalCards} total · ${global.masteredCards} mastered`} />
          {global.overdueCards > 0 && (
            <Metric label="Overdue" value={global.overdueCards} warn />
          )}
          <Metric label="Last Review" value={formatRelativeDate(global.lastReviewDate)} />
          {global.leitnerDistribution && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Deck</span>
              <LeitnerMiniBar distribution={global.leitnerDistribution} width={80} height={14} />
            </div>
          )}
          {global.weakPhonemes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Weak</span>
              {global.weakPhonemes.slice(0, 5).map(p => (
                <span key={p.phoneme} className="text-xs font-medium text-orange-600">
                  /{p.phoneme}/
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-book cards */}
      {books.length > 0 ? (
        books.map(book => (
          <BookReportCard
            key={book.bookId}
            book={book}
            onSelectChapter={onSelectChapter}
          />
        ))
      ) : (
        <div className="text-center text-gray-400 py-12 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm">No book data for this student yet</p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, warn }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${warn ? 'text-amber-600' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}
