import { useState } from 'react';
import { accuracyColor } from '../../lib/reportUtils';
import Sparkline from './Sparkline';
import LeitnerMiniBar from './LeitnerMiniBar';

const COLUMNS = [
  { key: 'studentName', label: 'Student', align: 'left' },
  { key: 'booksCompleted', label: 'Books', align: 'center' },
  { key: 'assignmentsDone', label: 'Assignments', align: 'center' },
  { key: 'avgWpm', label: 'WPM', align: 'left' },
  { key: 'avgAccuracy', label: 'Accuracy', align: 'left' },
  { key: 'weakPhonemes', label: 'Weak Phonemes', align: 'left' },
  { key: 'totalCards', label: 'Cards', align: 'left' },
  { key: 'exerciseAvg', label: 'Exercises', align: 'left' },
];

function sortValue(row, key) {
  if (key === 'weakPhonemes') return row.weakPhonemes.length;
  if (key === 'booksCompleted' || key === 'assignmentsDone') {
    const parts = row[key].split('/');
    return parseInt(parts[0], 10);
  }
  return row[key] ?? -Infinity;
}

export default function RosterTable({ rows, onSelectStudent }) {
  const [sortCol, setSortCol] = useState('studentName');
  const [sortDir, setSortDir] = useState('asc');

  function handleSort(key) {
    if (sortCol === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const va = sortValue(a, sortCol);
    const vb = sortValue(b, sortCol);
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va - vb);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-3 py-2.5 font-medium text-gray-500 text-xs cursor-pointer hover:text-gray-700 select-none whitespace-nowrap text-${col.align}`}
              >
                {col.label}
                {sortCol === col.key && (
                  <span className="ml-1 text-gray-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr
              key={row.studentId}
              onClick={() => onSelectStudent(row.studentId)}
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-3 py-2.5 font-medium text-gray-900 text-left whitespace-nowrap">
                {row.studentName}
              </td>
              <td className="px-3 py-2.5 text-gray-600 text-center tabular-nums">{row.booksCompleted}</td>
              <td className="px-3 py-2.5 text-gray-600 text-center tabular-nums">{row.assignmentsDone}</td>

              {/* WPM sparkline + delta */}
              <td className="px-3 py-2.5 text-left">
                <span className="inline-flex items-center gap-2">
                  <Sparkline values={row.wpmValues} color="#64748b" />
                  <DeltaBadge value={row.wpmDelta} show={row.wpmValues.length >= 2} />
                </span>
              </td>

              {/* Accuracy sparkline */}
              <td className="px-3 py-2.5 text-left">
                <Sparkline values={row.accuracyValues} color="#64748b" showValue={row.avgAccuracy != null} />
                {row.avgAccuracy != null && (
                  <span className="text-xs text-gray-400 ml-0.5">%</span>
                )}
              </td>

              {/* Weak phonemes */}
              <td className="px-3 py-2.5 text-left">
                <WeakPhonemesBadges phonemes={row.weakPhonemes} />
              </td>

              {/* Leitner mini bar + validated count */}
              <td className="px-3 py-2.5 text-left">
                <span className="inline-flex items-center gap-2">
                  <LeitnerMiniBar distribution={row.leitnerDistribution} />
                  <span className="text-xs text-gray-400 tabular-nums" title="Cards for assigned chapters">
                    {row.validatedCards}/{row.totalCards}
                  </span>
                </span>
              </td>

              {/* Exercise sparkline */}
              <td className="px-3 py-2.5 text-left">
                <Sparkline values={row.exerciseValues} color="#64748b" showValue={row.exerciseAvg != null} />
                {row.exerciseAvg != null && (
                  <span className="text-xs text-gray-400 ml-0.5">%</span>
                )}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-gray-400 text-sm">
                No students enrolled
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DeltaBadge({ value, show }) {
  if (!show) return null;
  const color = value > 0 ? 'bg-green-100 text-green-700' : value < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium tabular-nums ${color}`}>
      {value > 0 ? '+' : ''}{value}
    </span>
  );
}

function WeakPhonemesBadges({ phonemes, maxShow = 5 }) {
  if (!phonemes || phonemes.length === 0) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  const shown = phonemes.slice(0, maxShow);
  const overflow = phonemes.length - maxShow;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map(p => (
        <span
          key={p.phoneme}
          className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: accuracyColor(p.median) + '18', color: accuracyColor(p.median) }}
          title={`/${p.phoneme}/ — median ${p.median}, ${p.sessions} sessions`}
        >
          /{p.phoneme}/
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-xs text-gray-400">+{overflow}</span>
      )}
    </span>
  );
}
