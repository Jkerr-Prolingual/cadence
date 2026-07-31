import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getAssignments, getProgress, toggleTask } from '../../lib/assignments';
import { getUILabel } from '../../lib/locales';

const TASK_LABEL_KEYS = {
  readingPass: 'taskReadingPass',
  flashcards: 'taskFlashcards',
  recordAudio: 'taskRecordAudio',
  shadowReading: 'taskShadowReading',
  timedReading: 'taskTimedReading',
};

export default function AssignmentChecklist({ textId, refreshKey, onSelectText }) {
  const { user, l1 } = useAuth();
  const [allAssignments, setAllAssignments] = useState([]);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    loadData();
  }, [refreshKey, user?.id]);

  async function loadData() {
    if (!user?.id) return;

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', user.id);
    const classIds = (enrollments || []).map(e => e.class_id);

    if (classIds.length === 0) {
      setAllAssignments([]);
      setProgress([]);
      return;
    }

    const [assigns, prog] = await Promise.all([
      getAssignments(classIds),
      getProgress(user.id),
    ]);
    setAllAssignments(assigns);
    setProgress(prog);
  }

  function getStudentProgress(assignmentId) {
    return progress.find(p => p.assignmentId === assignmentId && p.studentId === user?.id);
  }

  async function handleToggle(assignmentId, taskKey) {
    const updated = await toggleTask(user.id, assignmentId, taskKey);
    setProgress(prev => {
      const without = prev.filter(p => p.id !== updated.id);
      return [...without, updated];
    });
  }

  const activeAssignments = allAssignments.filter(a => {
    if (a.archivedAt) return false;
    const prog = getStudentProgress(a.id);
    const taskList = Object.entries(a.tasks).filter(([, v]) => v);
    if (taskList.length === 0) return true;
    const allDone = taskList.every(([key]) => prog?.completed?.[key]);
    return !allDone;
  });

  if (activeAssignments.length === 0) return null;

  return (
    <div className="border-b border-gray-100 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {getUILabel('assignments', l1)}
        </h3>
        <div className="space-y-2">
          {activeAssignments.map(assignment => {
            const prog = getStudentProgress(assignment.id);
            const completed = prog?.completed || {};
            const taskList = Object.entries(assignment.tasks).filter(([, v]) => v);
            const allDone = taskList.every(([key]) => completed[key]);
            const isCurrentText = assignment.textId === textId;

            return (
              <div
                key={assignment.id}
                className={`rounded-lg border px-3 py-2 transition-colors cursor-pointer ${
                  isCurrentText
                    ? 'border-gray-300 bg-white'
                    : 'border-gray-200 bg-white/60 hover:bg-white'
                } ${allDone ? 'opacity-60' : ''}`}
                onClick={() => {
                  if (!isCurrentText) onSelectText(assignment.textId);
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0 mb-1">
                  <span className={`text-sm font-medium ${allDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {assignment.title}
                  </span>
                  {assignment.dueDate && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {getUILabel('dueLabel', l1)} {assignment.dueDate}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 sm:gap-y-1">
                  {taskList.map(([key]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 sm:gap-1.5 text-xs text-gray-600 cursor-pointer min-h-[32px] sm:min-h-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={!!completed[key]}
                        onChange={() => handleToggle(assignment.id, key)}
                        className="rounded border-gray-300 text-gray-900 w-4 h-4 sm:w-3.5 sm:h-3.5"
                      />
                      <span className={completed[key] ? 'line-through text-gray-400' : ''}>
                        {getUILabel(TASK_LABEL_KEYS[key], l1) || key}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
