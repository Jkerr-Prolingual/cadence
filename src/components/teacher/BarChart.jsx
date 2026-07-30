export default function BarChart({ values, labels, color = '#64748b', delta, height = 120, barWidth = 20, gap = 3, label }) {
  if (!values || values.length === 0) {
    return <span className="text-gray-300 text-xs">No data</span>;
  }

  const max = Math.max(...values, 1);
  const n = values.length;
  const svgWidth = n * barWidth + (n - 1) * gap;
  const chartTop = 16;
  const chartHeight = height - chartTop - 20;

  return (
    <div>
      {(label || delta != null) && (
        <div className="flex items-center gap-2 mb-2">
          {label && <span className="text-xs font-medium text-gray-500">{label}</span>}
          {delta != null && values.length >= 2 && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              delta > 0 ? 'bg-green-100 text-green-700' : delta < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>
      )}
      <svg width={svgWidth} height={height} className="overflow-visible">
        {/* Reference lines */}
        {[0.25, 0.5, 0.75, 1].map(pct => {
          const y = chartTop + chartHeight - pct * chartHeight;
          return (
            <line key={pct} x1={0} y1={y} x2={svgWidth} y2={y} stroke="#f3f4f6" strokeWidth={1} />
          );
        })}

        {/* Bars */}
        {values.map((v, i) => {
          const barHeight = Math.max(2, (v / max) * chartHeight);
          const x = i * (barWidth + gap);
          const y = chartTop + chartHeight - barHeight;
          const opacity = 0.4 + 0.6 * (i / Math.max(n - 1, 1));
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill={color}
                opacity={opacity}
              >
                <title>{labels?.[i] || `#${i + 1}`}: {v}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={y - 3}
                textAnchor="middle"
                className="text-[9px] fill-gray-400 tabular-nums"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels && values.map((_, i) => {
          const x = i * (barWidth + gap) + barWidth / 2;
          return (
            <text
              key={i}
              x={x}
              y={height - 2}
              textAnchor="middle"
              className="text-[9px] fill-gray-400"
            >
              {labels[i]?.length > 5 ? labels[i].slice(0, 5) : labels[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
