export default function Sparkline({ values, width = 80, height = 24, color = '#64748b', showValue = true }) {
  if (!values || values.length === 0) {
    return <span className="text-gray-300 text-xs">—</span>;
  }

  const max = Math.max(...values, 1);
  const gap = 1;
  const n = values.length;
  const barWidth = Math.max(2, (width - (n - 1) * gap) / n);
  const svgWidth = n * barWidth + (n - 1) * gap;

  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width={svgWidth} height={height} className="flex-shrink-0">
        {values.map((v, i) => {
          const barHeight = Math.max(2, (v / max) * height);
          return (
            <rect
              key={i}
              x={i * (barWidth + gap)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx={1}
              fill={i === n - 1 ? color : color + '80'}
            />
          );
        })}
      </svg>
      {showValue && (
        <span className="text-xs tabular-nums text-gray-600">
          {values[values.length - 1]}
        </span>
      )}
    </span>
  );
}
