export default function ReportNavHeader({
  student,
  allStudents,
  chapterTitle,
  onBack,
  onBackToStudent,
  prevStudent,
  nextStudent,
  onNavigateStudent,
  prevChapter,
  nextChapter,
  onNavigateChapter,
}) {
  const atChapter = !!chapterTitle;

  return (
    <div className="mb-5 border-b border-gray-200 pb-4 sticky top-0 bg-white z-10">
      {/* Back link */}
      <button
        onClick={atChapter ? onBackToStudent : onBack}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors mb-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {atChapter ? student.name : 'All Students'}
      </button>

      {/* Main row: name/title + prev/next */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          {atChapter ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 truncate">{chapterTitle}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{student.name}</p>
            </>
          ) : (
            <h2 className="text-lg font-bold text-gray-900 truncate">{student.name}</h2>
          )}
        </div>

        {/* Prev / Next controls */}
        <div className="flex items-center gap-1 shrink-0">
          {atChapter ? (
            <>
              <NavButton
                onClick={() => onNavigateChapter(prevChapter.textId)}
                disabled={!prevChapter}
                label={prevChapter?.label}
                direction="prev"
              />
              <NavButton
                onClick={() => onNavigateChapter(nextChapter.textId)}
                disabled={!nextChapter}
                label={nextChapter?.label}
                direction="next"
              />
            </>
          ) : (
            <>
              <NavButton
                onClick={() => onNavigateStudent(prevStudent?.id)}
                disabled={!prevStudent}
                label={prevStudent?.name}
                direction="prev"
              />
              {allStudents && allStudents.length > 1 && (
                <select
                  value={student.id}
                  onChange={(e) => onNavigateStudent(e.target.value)}
                  className="px-2 py-1.5 rounded-md text-xs font-medium text-gray-600 bg-gray-100 border-none cursor-pointer hover:bg-gray-200 transition-colors max-w-[10rem] truncate"
                >
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
              <NavButton
                onClick={() => onNavigateStudent(nextStudent?.id)}
                disabled={!nextStudent}
                label={nextStudent?.name}
                direction="next"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NavButton({ onClick, disabled, label, direction }) {
  const isPrev = direction === 'prev';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-default disabled:hover:bg-gray-100"
      title={label || undefined}
    >
      {isPrev && (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      )}
      <span className="max-w-[6rem] truncate hidden sm:inline">
        {label || (isPrev ? 'Prev' : 'Next')}
      </span>
      <span className="sm:hidden">{isPrev ? 'Prev' : 'Next'}</span>
      {!isPrev && (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
