import { useState } from 'react';
import useReportData from '../../hooks/useReportData';
import ReportFilters from './ReportFilters';
import RosterTable from './RosterTable';
import StudentReportCard from './StudentReportCard';
import ChapterReportDetail from './ChapterReportDetail';
import PronunciationDisclaimer from './PronunciationDisclaimer';

export default function ReportsTab({
  students,
  assignments,
  allTexts,
  books,
  fluencySessions,
  pronunciationAssessments,
  phonemeSessions,
  srsCards,
  exerciseResults,
  progress,
  studentRecordings,
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [bookFilter, setBookFilter] = useState(null);
  const [dateRange, setDateRange] = useState({});

  const { rosterRows, getStudentReport, getChapterDetail } = useReportData({
    students,
    assignments,
    allTexts,
    books,
    fluencySessions,
    pronunciationAssessments,
    phonemeSessions,
    srsCards,
    exerciseResults,
    progress,
    bookFilter,
    dateRange,
  });

  const selectedStudent = selectedStudentId
    ? students.find(s => s.id === selectedStudentId)
    : null;

  const studentIds = rosterRows.map(r => r.studentId);
  const currentIdx = studentIds.indexOf(selectedStudentId);
  const prevStudentId = currentIdx > 0 ? studentIds[currentIdx - 1] : null;
  const nextStudentId = currentIdx < studentIds.length - 1 ? studentIds[currentIdx + 1] : null;
  const navigateStudent = (id) => { setSelectedStudentId(id); setSelectedChapterId(null); };

  const selectedText = selectedChapterId
    ? allTexts.find(t => t.id === selectedChapterId)
    : null;

  const studentReport = selectedStudentId ? getStudentReport(selectedStudentId) : null;
  const chapterDetail = (selectedStudentId && selectedChapterId)
    ? getChapterDetail(selectedStudentId, selectedChapterId)
    : null;

  return (
    <div>
      <PronunciationDisclaimer />

      {/* Breadcrumb */}
      {selectedStudentId && (
        <nav className="flex items-center gap-1.5 text-sm mb-4">
          <button
            onClick={() => { setSelectedStudentId(null); setSelectedChapterId(null); }}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            All Students
          </button>
          {selectedStudent && (
            <>
              <span className="text-gray-400">/</span>
              <span className="inline-flex items-center gap-1">
                <button
                  onClick={() => navigateStudent(prevStudentId)}
                  disabled={!prevStudentId}
                  className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-default"
                  title={prevStudentId ? `Previous student` : undefined}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                </button>
                {selectedChapterId ? (
                  <button
                    onClick={() => setSelectedChapterId(null)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {selectedStudent.name}
                  </button>
                ) : (
                  <span className="text-gray-700 font-medium">{selectedStudent.name}</span>
                )}
                <button
                  onClick={() => navigateStudent(nextStudentId)}
                  disabled={!nextStudentId}
                  className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-default"
                  title={nextStudentId ? `Next student` : undefined}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
                </button>
              </span>
            </>
          )}
          {selectedText && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 font-medium">{selectedText.title}</span>
            </>
          )}
        </nav>
      )}

      {/* Roster view (default) */}
      {!selectedStudentId && (
        <>
          <ReportFilters
            books={books}
            bookFilter={bookFilter}
            onBookFilterChange={setBookFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <RosterTable
            rows={rosterRows}
            onSelectStudent={setSelectedStudentId}
          />
        </>
      )}

      {/* Student profile */}
      {selectedStudentId && !selectedChapterId && (
        <StudentReportCard
          report={studentReport}
          onSelectChapter={setSelectedChapterId}
        />
      )}

      {/* Chapter detail */}
      {selectedStudentId && selectedChapterId && (
        <ChapterReportDetail
          detail={chapterDetail}
          studentRecordings={studentRecordings}
        />
      )}
    </div>
  );
}
