import Sparkline from './Sparkline';

const GROWTH_MIN_SESSIONS = 5;

export default function PhonemeGrowthTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <span className="text-gray-300 text-xs">No phoneme data</span>;
  }

  const sorted = [...rows].sort((a, b) => a.current - b.current);

  return (
    <div>
      <span className="text-xs font-medium text-gray-500 mb-2 block">Phoneme Growth</span>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2.5 py-2 text-left font-medium text-gray-500">Phoneme</th>
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
              return (
                <tr key={row.phoneme} className="border-b border-gray-100">
                  <td className="px-2.5 py-2 font-medium text-gray-700">/{row.phoneme}/</td>
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
