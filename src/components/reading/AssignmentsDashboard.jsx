import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getAssignments, getProgress } from '../../lib/assignments';
import { getUILabel } from '../../lib/locales';

const TASK_KEYS = ['readingPass', 'flashcards', 'recordAudio', 'shadowReading', 'exercises'];
const TASK_HEADERS = {
  readingPass: 'Reading',
  flashcards: 'Cards',
  recordAudio: 'Record',
  shadowReading: 'Shadow',
  exercises: 'Exercises',
};

export default function AssignmentsDashboard({ userId, onSelectText, refreshKey, l1 }) {
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [pronunciationMap, setPronunciationMap] = useState({});
  const [exerciseMap, setExerciseMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId, refreshKey]);

  async function loadData() {
    setLoading(true);

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', userId);
    const classIds = (enrollments || []).map(e => e.class_id);
    if (classIds.length === 0) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    const [assigns, prog] = await Promise.all([
      getAssignments(classIds),
      getProgress(userId),
    ]);

    const active = assigns.filter(a => !a.archivedAt);
    const textIds = [...new Set(active.map(a => a.textId))];

    const [pronRes, exerciseRes] = await Promise.all([
      textIds.length > 0
        ? supabase.from('pronunciation_assessments').select('text_id, overall_accuracy, azure_fluency_score, wpm').eq('user_id', userId).in('text_id', textIds)
        : { data: [] },
      textIds.length > 0
        ? supabase.from('exercise_results').select('text_id, score, total').eq('user_id', userId).in('text_id', textIds)
        : { data: [] },
    ]);

    const pMap = {};
    for (const p of (pronRes.data || [])) {
      pMap[p.text_id] = p;
    }

    const eMap = {};
    for (const e of (exerciseRes.data || [])) {
      eMap[e.text_id] = e;
    }

    setAssignments(active);
    setProgress(prog);
    setPronunciationMap(pMap);
    setExerciseMap(eMap);
    setLoading(false);
  }

  function getCompleted(assignmentId) {
    const p = progress.find(pr => pr.assignmentId === assignmentId);
    return p?.completed || {};
  }

  function isAllDone(assignment) {
    const completed = getCompleted(assignment.id);
    const tasks = Object.entries(assignment.tasks).filter(([, v]) => v);
    if (tasks.length === 0) return false;
    return tasks.every(([key]) => completed[key]);
  }

  const sorted = [...assignments].sort((a, b) => {
    const aDone = isAllDone(a);
    const bDone = isAllDone(b);
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const visibleTasks = TASK_KEYS.filter(key =>
    assignments.some(a => a.tasks[key])
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        {getUILabel('loading', l1) || 'Loading...'}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-gray-500">{getUILabel('noAssignments', l1)}</p>
        <p className="text-xs text-gray-400 mt-1">{getUILabel('noAssignmentsHint', l1)}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 border-b border-gray-100">
            <th className="text-left font-medium py-2 pl-1 pr-3 whitespace-nowrap">
              {getUILabel('assignmentCol', l1)}
            </th>
            <th className="text-left font-medium py-2 px-2 whitespace-nowrap">
              {getUILabel('dueLabel', l1)}
            </th>
            {visibleTasks.map(key => (
              <th key={key} className="text-center font-medium py-2 px-1.5 whitespace-nowrap">
                {TASK_HEADERS[key]}
              </th>
            ))}
            <th className="text-center font-medium py-2 px-1.5 whitespace-nowrap">WPM</th>
            <th className="text-center font-medium py-2 px-1.5 whitespace-nowrap">
              {getUILabel('accuracy', l1)}
            </th>
            <th className="text-center font-medium py-2 px-1.5 whitespace-nowrap">
              {getUILabel('fluency', l1)}
            </th>
            <th className="w-6"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(assignment => {
            const completed = getCompleted(assignment.id);
            const allDone = isAllDone(assignment);
            const pron = pronunciationMap[assignment.textId];
            const latestWpm = pron?.wpm;
            const exercise = exerciseMap[assignment.textId];

            return (
              <tr
                key={assignment.id}
                className={`group border-b border-gray-50 cursor-pointer transition-colors ${allDone ? 'bg-green-50/40 hover:bg-gray-50' : 'hover:bg-amber-50'}`}
                onClick={() => onSelectText(assignment.textId)}
              >
                <td className="py-2 pl-1 pr-3">
                  <span className={`text-sm font-medium ${allDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {assignment.title}
                  </span>
                </td>
                <td className="py-2 px-2 whitespace-nowrap">
                  {assignment.dueDate ? (
                    <span className={`text-xs ${isDueSoon(assignment.dueDate) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {formatDueDate(assignment.dueDate)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">&mdash;</span>
                  )}
                </td>
                {visibleTasks.map(key => (
                  <td key={key} className="text-center py-2 px-1.5">
                    {!assignment.tasks[key] ? (
                      <span className="text-xs text-gray-200">&mdash;</span>
                    ) : key === 'shadowReading' ? (
                      <ShadowCell value={completed[key]} />
                    ) : key === 'exercises' ? (
                      <ExerciseCell completed={completed[key]} result={exercise} />
                    ) : completed[key] ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
                        &#10003;
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-500 text-xs">
                        &#9675;
                      </span>
                    )}
                  </td>
                ))}
                <td className="text-center py-2 px-1.5 tabular-nums">
                  {latestWpm != null ? (
                    <span className="text-xs text-gray-600">{Math.round(latestWpm)}</span>
                  ) : (
                    <span className="text-xs text-gray-300">&mdash;</span>
                  )}
                </td>
                <td className="text-center py-2 px-1.5 tabular-nums">
                  {pron?.overall_accuracy != null ? (
                    <span className={`text-xs font-medium ${pron.overall_accuracy >= 70 ? 'text-green-600' : pron.overall_accuracy >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {Math.round(pron.overall_accuracy)}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">&mdash;</span>
                  )}
                </td>
                <td className="text-center py-2 px-1.5 tabular-nums">
                  {pron?.azure_fluency_score != null ? (
                    <span className="text-xs text-gray-500">
                      F{Math.round(pron.azure_fluency_score)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">&mdash;</span>
                  )}
                </td>
                <td className="py-2 pl-1 pr-1">
                  {!allDone && (
                    <span className="text-gray-300 group-hover:text-amber-500 transition-colors text-xs">&#9654;</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ShadowCell({ value }) {
  if (!value) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-500 text-xs">
        &#9675;
      </span>
    );
  }
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
        &#10003;
      </span>
    );
  }
  if (typeof value === 'object' && value.totalSentences) {
    const pct = value.sentencesLooped / value.totalSentences;
    return (
      <span className={`text-xs font-medium tabular-nums ${pct >= 0.75 ? 'text-green-600' : 'text-amber-600'}`}>
        {value.sentencesLooped}/{value.totalSentences}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
      &#10003;
    </span>
  );
}

function ExerciseCell({ completed, result }) {
  if (result) {
    const pct = result.total > 0 ? result.score / result.total : 0;
    return (
      <span className={`text-xs font-medium tabular-nums ${pct >= 0.8 ? 'text-green-600' : pct >= 0.6 ? 'text-amber-600' : 'text-red-500'}`}>
        {result.score}/{result.total}
      </span>
    );
  }
  if (completed) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
        &#10003;
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-500 text-xs">
      &#9675;
    </span>
  );
}

function isDueSoon(dateStr) {
  const due = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const diffMs = due - now;
  return diffMs >= 0 && diffMs < 2 * 24 * 60 * 60 * 1000;
}

function formatDueDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}`;
}
