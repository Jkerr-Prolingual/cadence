export default function ReportFilters({ books, bookFilter, onBookFilterChange, dateRange, onDateRangeChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">Book</label>
        <select
          value={bookFilter || ''}
          onChange={e => onBookFilterChange(e.target.value || null)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          <option value="">All books</option>
          {books.map(b => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">From</label>
        <input
          type="date"
          value={dateRange?.start || ''}
          onChange={e => onDateRangeChange({ ...dateRange, start: e.target.value || null })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium">To</label>
        <input
          type="date"
          value={dateRange?.end || ''}
          onChange={e => onDateRangeChange({ ...dateRange, end: e.target.value || null })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {(bookFilter || dateRange?.start || dateRange?.end) && (
        <button
          onClick={() => {
            onBookFilterChange(null);
            onDateRangeChange({});
          }}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
