import Sparkline from './Sparkline';
import { ipaPhonemes } from '../../data/ipaPhonemes';
import { getConfusionDisplay } from '../../data/confusionPairs';

const GROWTH_MIN_SESSIONS = 5;

export default function PhonemeGrowthTable({ rows, confusionTrends }) {
  if (!rows || rows.length === 0) {
    return <span className="text-gray-300 text-xs">No phoneme data</span>;
  }

  const confusionByPhoneme = {};
  if (confusionTrends) {
    for (const ct of confusionTrends) {
      if (!confusionByPhoneme[ct.expected] || ct.current > confusionByPhoneme[ct.expected].current) {
        confusionByPhoneme[ct.expected] = ct;
      }
    }
  }

  const sorted = [...rows].sort((a, b) => a.current - b.current);
  const hasConfusion = Object.keys(confusionByPhoneme).length > 0;

  return (
    <div>
      <span className="text-xs font-medium text-gray-500 mb-2 block">Phoneme Growth</span>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2.5 py-2 text-left font-medium text-gray-500">Sound</th>
              {hasConfusion && (
                <th className="px-2.5 py-2 text-left font-medium text-gray-500">Confusion</th>
              )}
              <th className="px-2.5 py-2 text-left font-medium text-gray-500">Trend</th>
              <th className="px-2.5 py-2 text-right font-medium text-gray-500">Current</th>
              <th className="px-2.5 py-2 text-right font-medium text-gray-500">First</th>
              <th className="px-2.5 py-2 text-right font-medium text-gray-500">Change</th>
              <th className="px-2.5 py-2 text-right font-medium text-gray-500">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => {
              const hasEnoughData = row.sessions >= GROWTH_MIN_SESSIONS;
              const sparkColor = row.current < 50 ? '#f97316' : row.current < 70 ? '#eab308' : '#64748b';
              const pd = ipaPhonemes[row.phoneme];
              const confusion = confusionByPhoneme[row.phoneme];
              return (
                <tr key={row.phoneme} className="border-b border-gray-100">
                  <td className="px-2.5 py-2 font-medium text-gray-700">
                    <span title={`/${row.phoneme}/`}>
                      {pd ? (
                        <span>
                          <strong>{pd.exampleHighlight}</strong>
                          <span className="text-gray-400 ml-1">({pd.example})</span>
                        </span>
                      ) : (
                        <span>/{row.phoneme}/</span>
                      )}
                    </span>
                  </td>
                  {hasConfusion && (
                    <td className="px-2.5 py-2">
                      {confusion ? (
                        <ConfusionCell confusion={confusion} />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-2.5 py-2">
                    {row.values && row.values.length > 1 ? (
                      <Sparkline values={row.values} width={60} height={18} color={sparkColor} showValue={false} />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums text-gray-700">{row.current}</td>
                  <td className="px-2.5 py-2 text-right tabular-nums text-gray-500">
                    {hasEnoughData ? row.first : '—'}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums">
                    {hasEnoughData ? (
                      <ChangeCell value={row.change} />
                    ) : (
                      <span className="text-gray-300 italic">insufficient data</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2 text-right tabular-nums text-gray-400">{row.sessions}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfusionCell({ confusion }) {
  const display = getConfusionDisplay(confusion.expected, confusion.alternate);
  const altPd = ipaPhonemes[confusion.alternate];
  const resolved = confusion.resolved;

  const label = display
    ? `${display.word1} / ${display.word2}`
    : altPd
      ? `sounds like ${altPd.exampleHighlight} (${altPd.example})`
      : `→ /${confusion.alternate}/`;

  return (
    <span
      className={`inline-block text-[11px] px-1.5 py-0.5 rounded ${
        resolved
          ? 'bg-green-50 text-green-600'
          : confusion.current > 20
            ? 'bg-orange-50 text-orange-600'
            : 'bg-amber-50 text-amber-600'
      }`}
      title={`Gap: ${confusion.current > 0 ? '+' : ''}${confusion.current} (${resolved ? 'resolved' : 'active'})`}
    >
      {resolved && '✓ '}{label}
    </span>
  );
}

function ChangeCell({ value }) {
  if (value === 0) {
    return <span className="text-gray-400">0</span>;
  }
  const color = value > 0 ? 'text-green-600' : 'text-red-600';
  return (
    <span className={`font-medium ${color}`}>
      {value > 0 ? '+' : ''}{value}
    </span>
  );
}
