import { useState, useMemo } from 'react';
import useReportData from '../../hooks/useReportData';
import ReportFilters from './ReportFilters';
import RosterTable from './RosterTable';
import StudentReportCard from './StudentReportCard';
import ChapterReportDetail from './ChapterReportDetail';
import PronunciationDisclaimer from './PronunciationDisclaimer';
import ReportNavHeader from './ReportNavHeader';

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

  const { rosterRows, getStudentReport, getChapterDetail, assignedBookIds } = useReportData({
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

  const navigateStudent = (id) => { setSelectedStudentId(id); setSelectedChapterId(null); };

  const selectedStudent = selectedStudentId
    ? students.find(s => s.id === selectedStudentId)
    : null;

  const studentReport = selectedStudentId ? getStudentReport(selectedStudentId) : null;
  const chapterDetail = (selectedStudentId && selectedChapterId)
    ? getChapterDetail(selectedStudentId, selectedChapterId)
    : null;

  // Prev/next student from roster order
  const studentIds = rosterRows.map(r => r.studentId);
  const currentStudentIdx = studentIds.indexOf(selectedStudentId);
  const prevStudent = currentStudentIdx > 0
    ? students.find(s => s.id === studentIds[currentStudentIdx - 1])
    : null;
  const nextStudent = currentStudentIdx >= 0 && currentStudentIdx < studentIds.length - 1
    ? students.find(s => s.id === studentIds[currentStudentIdx + 1])
    : null;

  // Flat chapter list for the selected student's report (for prev/next chapter)
  const chapterList = useMemo(() => {
    if (!studentReport) return [];
    const list = [];
    for (const book of studentReport.books) {
      for (const ch of book.chapters) {
        list.push(ch);
      }
    }
    return list;
  }, [studentReport]);

  const currentChapterIdx = chapterList.findIndex(ch => ch.textId === selectedChapterId);
  const prevChapter = currentChapterIdx > 0 ? chapterList[currentChapterIdx - 1] : null;
  const nextChapter = currentChapterIdx >= 0 && currentChapterIdx < chapterList.length - 1
    ? chapterList[currentChapterIdx + 1]
    : null;

  const selectedText = selectedChapterId
    ? allTexts.find(t => t.id === selectedChapterId)
    : null;

  return (
    <div>
      <PronunciationDisclaimer />

      {/* Navigation header (student or chapter level) */}
      {selectedStudentId && selectedStudent && (
        <ReportNavHeader
          student={selectedStudent}
          chapterTitle={selectedChapterId ? (selectedText?.title || chapterDetail?.chapterTitle) : null}
          onBack={() => { setSelectedStudentId(null); setSelectedChapterId(null); }}
          onBackToStudent={() => setSelectedChapterId(null)}
          prevStudent={prevStudent}
          nextStudent={nextStudent}
          onNavigateStudent={navigateStudent}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          onNavigateChapter={setSelectedChapterId}
        />
      )}

      {/* Roster view (default) */}
      {!selectedStudentId && (
        <>
          <ReportFilters
            books={books.filter(b => assignedBookIds.has(b.id))}
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
