import { accuracyColor } from '../../lib/reportUtils';

export default function PhonemeHistogram({ phonemes, height = 120, barWidth = 22, gap = 3 }) {
  if (!phonemes || phonemes.length === 0) {
    return <span className="text-gray-300 text-xs">No phoneme data</span>;
  }

  const sorted = [...phonemes].sort((a, b) => a.median - b.median);
  const n = sorted.length;
  const svgWidth = n * barWidth + (n - 1) * gap;
  const chartTop = 16;
  const chartHeight = height - chartTop - 22;

  return (
    <div>
      <span className="text-xs font-medium text-gray-500 mb-2 block">Phoneme Accuracy</span>
      <div className="overflow-x-auto">
        <svg width={svgWidth} height={height} className="overflow-visible">
          {/* Reference lines */}
          {[25, 50, 75, 100].map(val => {
            const y = chartTop + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line x1={0} y1={y} x2={svgWidth} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                <text x={-4} y={y + 3} textAnchor="end" className="text-[8px] fill-gray-300 tabular-nums">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {sorted.map((p, i) => {
            const barHeight = Math.max(2, (p.median / 100) * chartHeight);
            const x = i * (barWidth + gap);
            const y = chartTop + chartHeight - barHeight;
            return (
              <g key={p.phoneme}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={2}
                  fill={accuracyColor(p.median)}
                  opacity={0.85}
                >
                  <title>/{p.phoneme}/ — median {p.median}</title>
                </rect>
                <text
                  x={x + barWidth / 2}
                  y={y - 3}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-500 tabular-nums"
                >
                  {p.median}
                </text>
                {/* IPA label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 4}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-600 font-medium"
                >
                  {p.phoneme}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
