import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { sampleTexts } from '../../data/sampleTexts';
import { cefrColor } from '../../lib/wordUtils';

function generateJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [curatedTexts, setCuratedTexts] = useState([]);
  const [books, setBooks] = useState([]);
  const [studentRecordings, setStudentRecordings] = useState([]);
  const [fluencySessions, setFluencySessions] = useState([]);
  const [srsCards, setSrsCards] = useState([]);
  const [reviewLogs, setReviewLogs] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [createError, setCreateError] = useState(null);

  const allTexts = useMemo(() => {
    const curated = curatedTexts.map(t => ({
      ...t,
      cefr: t.cefr_estimate || t.cefr,
    }));
    return [...sampleTexts, ...curated];
  }, [curatedTexts]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [clsRes, textsRes, booksRes] = await Promise.all([
      supabase.from('classes').select('*').eq('teacher_id', user.id),
      supabase.from('curated_texts').select('id, title, author, cefr_estimate, status, audio_urls, book_id, chapter_order')
        .eq('status', 'published'),
      supabase.from('books').select('id, title').eq('status', 'published'),
    ]);
    const cls = clsRes.data || [];
    setClasses(cls);
    setCuratedTexts(textsRes.data || []);
    setBooks(booksRes.data || []);

    if (cls.length > 0) {
      if (!selectedClassId) setSelectedClassId(cls[0].id);
      const classIds = cls.map(c => c.id);

      const [enrollRes, assignRes, progRes] = await Promise.all([
        supabase.from('class_enrollments').select('*').in('class_id', classIds),
        supabase.from('assignments').select('*').in('class_id', classIds),
        supabase.from('assignment_progress').select('*'),
      ]);

      const enrollData = enrollRes.data || [];
      setEnrollments(enrollData);
      setAssignments((assignRes.data || []).map(fromSupabaseAssignment));
      setProgress((progRes.data || []).map(fromSupabaseProgress));

      const studentIds = [...new Set(enrollData.map(e => e.student_id))];
      if (studentIds.length > 0) {
        const [profilesRes, recordingsRes, fluencyRes, cardsRes, reviewsRes] = await Promise.all([
          supabase.from('profiles').select('id, display_name, email').in('id', studentIds),
          supabase.from('student_recordings').select('*').in('user_id', studentIds),
          supabase.from('fluency_sessions').select('*').in('user_id', studentIds).order('session_date', { ascending: true }),
          supabase.from('srs_cards').select('user_id, word, text_id, leitner_box, card_type, cefr, added_date, last_review_date').in('user_id', studentIds),
          supabase.from('review_log').select('user_id, word, correct, reviewed_at').in('user_id', studentIds),
        ]);
        if (profilesRes.error) console.error('Profiles fetch error:', profilesRes.error);
        const map = {};
        for (const p of (profilesRes.data || [])) map[p.id] = p;
        setStudentProfiles(map);
        setStudentRecordings(recordingsRes.data || []);
        setFluencySessions(fluencyRes.data || []);
        setSrsCards(cardsRes.data || []);
        setReviewLogs(reviewsRes.data || []);
      }
    }
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classAssignments = assignments.filter(a => a.classId === selectedClassId);
  const classStudents = enrollments
    .filter(e => e.class_id === selectedClassId)
    .map(e => ({
      id: e.student_id,
      name: studentProfiles[e.student_id]?.display_name || studentProfiles[e.student_id]?.email || 'Unknown',
      joinedAt: e.enrolled_at,
    }));

  async function handleCreateClass() {
    if (!newClassName.trim()) return;
    setCreateError(null);
    const { data, error } = await supabase
      .from('classes')
      .insert({
        class_name: newClassName.trim(),
        class_code: generateJoinCode(),
        teacher_id: user.id,
      })
      .select()
      .single();
    if (error) {
      console.error('Create class error:', error);
      setCreateError(error.message);
      return;
    }
    setClasses(prev => [...prev, data]);
    setSelectedClassId(data.id);
    setNewClassName('');
    setShowCreateClass(false);
  }

  async function handleDeleteClass(classId) {
    await supabase.from('classes').delete().eq('id', classId);
    setClasses(prev => prev.filter(c => c.id !== classId));
    if (selectedClassId === classId) {
      setSelectedClassId(classes.find(c => c.id !== classId)?.id || null);
    }
  }

  async function handleRemoveStudent(studentId) {
    if (!selectedClassId) return;
    await supabase
      .from('class_enrollments')
      .delete()
      .eq('class_id', selectedClassId)
      .eq('student_id', studentId);
    setEnrollments(prev => prev.filter(
      e => !(e.class_id === selectedClassId && e.student_id === studentId)
    ));
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Teacher Dashboard</h1>

        {/* Class selector */}
        <div className="flex items-center gap-3 mb-6">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedClassId === cls.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cls.class_name}
            </button>
          ))}
          <button
            onClick={() => setShowCreateClass(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + New class
          </button>
        </div>

        {/* Create class form */}
        {showCreateClass && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
            <input
              type="text"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateClass()}
              placeholder="Class name (e.g. Period 3 ELD)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              autoFocus
            />
            <button
              onClick={handleCreateClass}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Create
            </button>
            <button
              onClick={() => { setShowCreateClass(false); setNewClassName(''); setCreateError(null); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            {createError && (
              <span className="text-sm text-red-600">{createError}</span>
            )}
          </div>
        )}

        {selectedClass && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left column: class info & students */}
            <div className="col-span-1 space-y-4">
              <ClassInfoPanel
                cls={selectedClass}
                students={classStudents}
                onRemoveStudent={handleRemoveStudent}
                onDeleteClass={() => handleDeleteClass(selectedClass.id)}
              />
            </div>

            {/* Right column: assignments & progress */}
            <div className="col-span-2 space-y-4">
              <AssignmentsPanel
                assignments={classAssignments}
                allTexts={allTexts}
                books={books}
                students={classStudents}
                progress={progress}
                studentRecordings={studentRecordings}
                fluencySessions={fluencySessions}
                srsCards={srsCards}
                reviewLogs={reviewLogs}
                classId={selectedClassId}
                showCreate={showCreateAssignment}
                onShowCreate={setShowCreateAssignment}
                onCreated={loadData}
                onDeleted={loadData}
              />
            </div>
          </div>
        )}

        {!selectedClass && !showCreateClass && (
          <div className="text-center text-gray-400 py-16 border border-dashed border-gray-200 rounded-lg">
            <p className="text-lg">No classes yet</p>
            <p className="text-sm mt-2">Create a class to start assigning texts to students</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassInfoPanel({ cls, students, onRemoveStudent, onDeleteClass }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">{cls.class_name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Join code: <span className="font-mono font-semibold text-gray-700">{cls.class_code}</span>
        </p>
      </div>

      <div className="px-4 py-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Students ({students.length})
        </h4>

        {students.length === 0 && (
          <p className="text-xs text-gray-400 mb-3">No students enrolled yet. Share the join code with students.</p>
        )}

        <ul className="space-y-1 mb-3">
          {students.map(s => (
            <li key={s.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50 group">
              <span className="text-sm text-gray-700">{s.name}</span>
              <button
                onClick={() => onRemoveStudent(s.id)}
                className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={onDeleteClass}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Delete class
        </button>
      </div>
    </div>
  );
}

function AssignmentsPanel({ assignments, allTexts, books, students, progress, studentRecordings, fluencySessions, srsCards, reviewLogs, classId, showCreate, onShowCreate, onCreated, onDeleted }) {
  const [showArchived, setShowArchived] = useState(false);

  const activeAssignments = assignments.filter(a => !a.archivedAt);
  const archivedAssignments = assignments.filter(a => a.archivedAt);
  const displayedAssignments = showArchived ? assignments : activeAssignments;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Assignments</h3>
          {archivedAssignments.length > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showArchived ? 'Hide' : 'Show'} archived ({archivedAssignments.length})
            </button>
          )}
        </div>
        <button
          onClick={() => onShowCreate(true)}
          className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          + New assignment
        </button>
      </div>

      {showCreate && (
        <CreateAssignmentForm
          allTexts={allTexts}
          books={books}
          classId={classId}
          onCreated={() => { onShowCreate(false); onCreated(); }}
          onCancel={() => onShowCreate(false)}
        />
      )}

      {activeAssignments.length === 0 && !showCreate && !showArchived && (
        <div className="text-center text-gray-400 py-10 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm">No assignments yet</p>
        </div>
      )}

      <div className="space-y-3">
        {displayedAssignments.map(a => (
          <AssignmentCard
            key={a.id}
            assignment={a}
            allTexts={allTexts}
            students={students}
            progress={progress.filter(p => p.assignmentId === a.id)}
            studentRecordings={studentRecordings.filter(r => r.text_id === a.textId)}
            fluencySessions={fluencySessions.filter(f => f.text_id === a.textId)}
            srsCards={srsCards.filter(c => c.text_id === a.textId)}
            reviewLogs={reviewLogs}
            onChanged={onDeleted}
          />
        ))}
      </div>
    </div>
  );
}

function CreateAssignmentForm({ allTexts, books = [], classId, onCreated, onCancel }) {
  const [selectedTextId, setSelectedTextId] = useState('');
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState({ readingPass: true, flashcards: true, recordAudio: false, shadowReading: false, timedReading: false });
  const [dueDate, setDueDate] = useState('');
  const selectedText = allTexts.find(t => t.id === selectedTextId);
  const hasAudio = selectedText?.audio_urls || selectedText?.audioUrls;

  const bookMap = useMemo(() => {
    const map = {};
    for (const b of books) map[b.id] = b.title;
    return map;
  }, [books]);

  const { bookTexts, standaloneTexts } = useMemo(() => {
    const byBook = {};
    const standalone = [];
    for (const t of allTexts) {
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
    return { bookTexts: byBook, standaloneTexts: standalone };
  }, [allTexts, bookMap]);

  async function handleCreate() {
    if (!selectedTextId) return;
    const text = selectedText;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const { error } = await supabase.from('assignments').insert({
      id,
      class_id: classId,
      text_id: selectedTextId,
      title: title.trim() || `Read: ${text?.title || selectedTextId}`,
      tasks: {
        readingPass: tasks.readingPass,
        flashcards: tasks.flashcards,
        recordAudio: tasks.recordAudio,
        shadowReading: tasks.shadowReading,
        timedReading: tasks.timedReading,
      },
      due_date: dueDate || null,
    });
    if (!error) onCreated();
  }

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Text</label>
        <select
          value={selectedTextId}
          onChange={e => {
            setSelectedTextId(e.target.value);
            const t = allTexts.find(x => x.id === e.target.value);
            if (t && !title) setTitle(`Read: ${t.title}`);
            if (!t?.audio_urls && !t?.audioUrls) setTasks(prev => ({ ...prev, shadowReading: false }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Select a text...</option>
          {books.map(b => {
            const chapters = bookTexts[b.id];
            if (!chapters?.length) return null;
            return (
              <optgroup key={b.id} label={b.title}>
                {chapters.map(t => (
                  <option key={t.id} value={t.id}>
                    Ch. {t.chapter_order ?? '?'}: {t.title} — {t.cefr || t.cefr_estimate || 'unrated'}
                  </option>
                ))}
              </optgroup>
            );
          })}
          {standaloneTexts.length > 0 && books.some(b => bookTexts[b.id]?.length) && (
            <optgroup label="Standalone Texts">
              {standaloneTexts.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} — {t.cefr || t.cefr_estimate || 'unrated'}
                </option>
              ))}
            </optgroup>
          )}
          {(!books.some(b => bookTexts[b.id]?.length)) && standaloneTexts.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} — {t.cefr || t.cefr_estimate || 'unrated'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Assignment title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Read: The Monkey's Paw"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Required tasks</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={tasks.readingPass}
              onChange={e => setTasks(prev => ({ ...prev, readingPass: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Reading pass
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={tasks.flashcards}
              onChange={e => setTasks(prev => ({ ...prev, flashcards: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Create flashcards
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={tasks.recordAudio}
              onChange={e => setTasks(prev => ({ ...prev, recordAudio: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Record audio
          </label>
          <label className={`flex items-center gap-2 text-sm ${hasAudio ? 'text-gray-700' : 'text-gray-300'}`}>
            <input
              type="checkbox"
              checked={tasks.shadowReading}
              onChange={e => setTasks(prev => ({ ...prev, shadowReading: e.target.checked }))}
              className="rounded border-gray-300"
              disabled={!hasAudio}
            />
            Shadow reading
            {!hasAudio && selectedTextId && <span className="text-xs text-gray-400">(no audio)</span>}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={tasks.timedReading}
              onChange={e => setTasks(prev => ({ ...prev, timedReading: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Timed reading
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Due date (optional)</label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleCreate}
          disabled={!selectedTextId}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create assignment
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AssignmentCard({ assignment, allTexts, students, progress, studentRecordings, fluencySessions, srsCards, reviewLogs, onChanged }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [playingStudentId, setPlayingStudentId] = useState(null);
  const [audioUrls, setAudioUrls] = useState({});
  const [expandedFlashcardStudent, setExpandedFlashcardStudent] = useState(null);
  const audioElRef = useRef(null);
  const text = allTexts.find(t => t.id === assignment.textId);
  const taskList = Object.entries(assignment.tasks).filter(([, v]) => v);
  const isArchived = !!assignment.archivedAt;
  const hasRecordTask = !!assignment.tasks.recordAudio;
  const hasTimedTask = !!assignment.tasks.timedReading;
  const hasFlashcardTask = !!assignment.tasks.flashcards;
  const hasShadowTask = !!assignment.tasks.shadowReading;

  function getStudentCompletion(studentId) {
    const p = progress.find(p => p.studentId === studentId);
    if (!p) return {};
    return p.completed || {};
  }

  function getStudentRecording(studentId) {
    return studentRecordings.find(r => r.user_id === studentId);
  }

  function getStudentWpmHistory(studentId) {
    return fluencySessions
      .filter(f => f.student_id === studentId)
      .map(f => f.wpm);
  }

  function getStudentCards(studentId) {
    return (srsCards || []).filter(c => c.user_id === studentId);
  }

  function getStudentReviews(studentId, cardWords) {
    return (reviewLogs || []).filter(r => r.user_id === studentId && cardWords.has(r.word));
  }

  async function handlePlayRecording(studentId) {
    const rec = getStudentRecording(studentId);
    if (!rec) return;

    if (playingStudentId === studentId) {
      if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
      setPlayingStudentId(null);
      return;
    }

    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }

    let url = audioUrls[studentId];
    if (!url) {
      const { data } = await supabase.storage
        .from('student-recordings')
        .createSignedUrl(rec.storage_path, 3600);
      if (data?.signedUrl) {
        url = data.signedUrl;
        setAudioUrls(prev => ({ ...prev, [studentId]: url }));
      }
    }
    if (!url) return;

    const audio = new Audio(url);
    audioElRef.current = audio;
    audio.onended = () => setPlayingStudentId(null);
    audio.play().catch(() => setPlayingStudentId(null));
    setPlayingStudentId(studentId);
  }

  async function handleDelete() {
    await supabase.from('assignments').delete().eq('id', assignment.id);
    onChanged();
  }

  async function handleArchiveToggle() {
    if (isArchived) {
      await supabase.from('assignments').update({ archived_at: null }).eq('id', assignment.id);
    } else {
      await supabase.from('assignments').update({ archived_at: new Date().toISOString() }).eq('id', assignment.id);
    }
    onChanged();
  }

  const completionCount = students.reduce((acc, s) => {
    const completed = getStudentCompletion(s.id);
    const allDone = taskList.every(([key]) => completed[key]);
    return acc + (allDone ? 1 : 0);
  }, 0);

  return (
    <div className={`border rounded-lg overflow-hidden ${isArchived ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-gray-200'}`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-semibold ${isArchived ? 'text-gray-400' : 'text-gray-900'}`}>{assignment.title}</h4>
            {isArchived && (
              <span className="text-[10px] font-medium text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                Archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {text && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: cefrColor(text.cefr || text.cefr_estimate) }}
                />
                {text.cefr || text.cefr_estimate}
              </span>
            )}
            {assignment.dueDate && (
              <span className="text-xs text-gray-400">Due: {assignment.dueDate}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {completionCount}/{students.length} complete
          </span>
          <button
            onClick={handleArchiveToggle}
            className="text-xs text-gray-300 hover:text-gray-600 transition-colors"
          >
            {isArchived ? 'Unarchive' : 'Archive'}
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-gray-300 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-red-500">Delete?</span>
              <button
                onClick={handleDelete}
                className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                No
              </button>
            </span>
          )}
        </div>
      </div>

      {students.length > 0 && !isArchived && (
        <div className="border-t border-gray-100 px-4 py-2">
          {(hasShadowTask || hasFlashcardTask) && (
            <div className="flex items-center gap-3 mb-1.5 text-[10px] text-gray-400">
              {hasShadowTask && (
                <span>Shadow: sentences looped/total &mdash; <span className="text-green-600">green</span> &ge;75%, <span className="text-amber-600">amber</span> &lt;75%</span>
              )}
              {hasFlashcardTask && (
                <span>Flashcards: <span className="text-green-600">green</span> = reviewed, <span className="text-amber-600">amber</span> = not yet reviewed. Click for details.</span>
              )}
            </div>
          )}
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="text-left font-medium py-1">Student</th>
                {taskList.map(([key]) => (
                  <th key={key} className="text-center font-medium py-1 w-28">
                    {{ readingPass: 'Reading', flashcards: 'Flashcards', recordAudio: 'Recording', shadowReading: 'Shadow', timedReading: 'Timed' }[key] || key}
                  </th>
                ))}
                {hasRecordTask && <th className="text-center font-medium py-1 w-20">Listen</th>}
                {hasTimedTask && <th className="text-left font-medium py-1">WPM</th>}
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const completed = getStudentCompletion(s.id);
                const rec = getStudentRecording(s.id);
                const cards = getStudentCards(s.id);
                const cardWords = new Set(cards.map(c => c.word));
                const reviews = getStudentReviews(s.id, cardWords);
                return (
                  <React.Fragment key={s.id}>
                    <tr className="border-t border-gray-50">
                      <td className="text-sm text-gray-700 py-1.5">{s.name}</td>
                      {taskList.map(([key]) => (
                        <td key={key} className="text-center py-1.5">
                          {key === 'shadowReading' ? (
                            <ShadowStatus value={completed[key]} />
                          ) : key === 'flashcards' ? (
                            <FlashcardStatus
                              cards={cards}
                              reviews={reviews}
                              completed={completed[key]}
                              expanded={expandedFlashcardStudent === s.id}
                              onToggleExpand={() => setExpandedFlashcardStudent(
                                expandedFlashcardStudent === s.id ? null : s.id
                              )}
                            />
                          ) : completed[key] ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-300 text-xs">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                      {hasRecordTask && (
                        <td className="text-center py-1.5">
                          {rec ? (
                            <button
                              onClick={() => handlePlayRecording(s.id)}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                playingStudentId === s.id
                                  ? 'bg-gray-900 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {playingStudentId === s.id ? 'Stop' : 'Play'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      )}
                      {hasTimedTask && (
                        <td className="py-1.5">
                          <WpmTimeline readings={getStudentWpmHistory(s.id)} />
                        </td>
                      )}
                    </tr>
                    {expandedFlashcardStudent === s.id && hasFlashcardTask && (
                      <tr>
                        <td colSpan={taskList.length + 1 + (hasRecordTask ? 1 : 0) + (hasTimedTask ? 1 : 0)}>
                          <FlashcardDetail cards={cards} reviews={reviews} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ShadowStatus({ value }) {
  if (!value) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-300 text-xs">
        —
      </span>
    );
  }
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
        ✓
      </span>
    );
  }
  const { sentencesLooped = 0, totalSentences = 0 } = value;
  const ratio = totalSentences > 0 ? sentencesLooped / totalSentences : 0;
  const colorClass = ratio >= 0.75
    ? 'bg-green-100 text-green-700'
    : 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center justify-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${colorClass}`}>
      {sentencesLooped}/{totalSentences}
    </span>
  );
}

function FlashcardStatus({ cards, reviews, completed, expanded, onToggleExpand }) {
  if (cards.length === 0 && !completed) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-300 text-xs">
        —
      </span>
    );
  }
  if (cards.length === 0 && completed) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
        ✓
      </span>
    );
  }
  const hasReviews = reviews.length > 0;
  const colorClass = hasReviews
    ? 'bg-green-100 text-green-700 hover:bg-green-200'
    : 'bg-amber-100 text-amber-700 hover:bg-amber-200';
  return (
    <button
      onClick={onToggleExpand}
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${colorClass}`}
    >
      {cards.length} {cards.length === 1 ? 'card' : 'cards'}
      <span className="text-[8px]">{expanded ? '▾' : '▸'}</span>
    </button>
  );
}

function FlashcardDetail({ cards, reviews }) {
  const reviewsByWord = {};
  for (const r of reviews) {
    if (!reviewsByWord[r.word]) reviewsByWord[r.word] = [];
    reviewsByWord[r.word].push(r);
  }

  const totalReviews = reviews.length;
  const correctReviews = reviews.filter(r => r.correct).length;

  return (
    <div className="bg-gray-50 rounded-lg mx-2 mb-2 p-3">
      {totalReviews > 0 && (
        <p className="text-[10px] text-gray-500 mb-2">
          {totalReviews} review{totalReviews !== 1 ? 's' : ''}, {correctReviews} correct ({totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0}%)
        </p>
      )}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-400">
            <th className="text-left font-medium py-0.5">Word</th>
            <th className="text-center font-medium py-0.5 w-12">CEFR</th>
            <th className="text-center font-medium py-0.5 w-12">Box</th>
            <th className="text-center font-medium py-0.5 w-16">Reviews</th>
            <th className="text-left font-medium py-0.5">Last Review</th>
          </tr>
        </thead>
        <tbody>
          {cards.map(card => {
            const wordReviews = reviewsByWord[card.word] || [];
            const lastReview = wordReviews.length > 0
              ? wordReviews.reduce((latest, r) => r.reviewed_at > latest.reviewed_at ? r : latest)
              : null;
            return (
              <tr key={card.word} className="border-t border-gray-200">
                <td className="py-1 text-gray-700 font-medium">{card.word}</td>
                <td className="py-1 text-center">
                  {card.cefr && (
                    <span
                      className="text-[10px] font-bold px-1 py-0.5 rounded"
                      style={{ backgroundColor: cefrColor(card.cefr) + '20', color: cefrColor(card.cefr) }}
                    >
                      {card.cefr}
                    </span>
                  )}
                </td>
                <td className="py-1 text-center">
                  <LeitnerBox box={card.leitner_box} />
                </td>
                <td className="py-1 text-center text-gray-500">
                  {wordReviews.length || '—'}
                </td>
                <td className="py-1 text-gray-400">
                  {lastReview ? formatRelativeDate(lastReview.reviewed_at) : 'never'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LeitnerBox({ box }) {
  if (!box) return <span className="text-gray-300">—</span>;
  const colors = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-orange-100 text-orange-700',
    3: 'bg-amber-100 text-amber-700',
    4: 'bg-green-100 text-green-700',
    5: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${colors[box] || 'bg-gray-100 text-gray-500'}`}>
      {box}
    </span>
  );
}

function formatRelativeDate(dateStr) {
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

function WpmTimeline({ readings }) {
  if (readings.length === 0) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  const first = readings[0];
  const last = readings[readings.length - 1];
  const delta = readings.length > 1 ? last - first : null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-mono tabular-nums">
        {readings.join(' → ')}
      </span>
      {delta !== null && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          delta > 0
            ? 'text-green-700 bg-green-50'
            : delta < 0
              ? 'text-red-600 bg-red-50'
              : 'text-gray-500 bg-gray-100'
        }`}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
      )}
    </div>
  );
}

function fromSupabaseAssignment(row) {
  return {
    id: row.id,
    classId: row.class_id,
    textId: row.text_id,
    title: row.title,
    tasks: row.tasks || {},
    dueDate: row.due_date,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

function fromSupabaseProgress(row) {
  if (!row) return null;
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    completed: row.completed || {},
    updatedAt: row.updated_at,
  };
}
