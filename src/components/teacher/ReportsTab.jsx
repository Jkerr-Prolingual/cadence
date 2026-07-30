import { useState } from 'react';
import useReportData from '../../hooks/useReportData';
import ReportFilters from './ReportFilters';
import RosterTable from './RosterTable';
import StudentReportCard from './StudentReportCard';
import ChapterReportDetail from './ChapterReportDetail';

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

  const selectedText = selectedChapterId
    ? allTexts.find(t => t.id === selectedChapterId)
    : null;

  const studentReport = selectedStudentId ? getStudentReport(selectedStudentId) : null;
  const chapterDetail = (selectedStudentId && selectedChapterId)
    ? getChapterDetail(selectedStudentId, selectedChapterId)
    : null;

  return (
    <div>
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
