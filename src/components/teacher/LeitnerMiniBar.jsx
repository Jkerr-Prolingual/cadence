const BOX_COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];

export default function LeitnerMiniBar({ distribution, width = 60, height = 12 }) {
  const total = distribution.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <span className="text-gray-300 text-xs">—</span>;
  }

  const mastered = distribution[3] + distribution[4];
  const masteryPct = Math.round((mastered / total) * 100);

  let x = 0;
  const segments = distribution.map((count, i) => {
    const segWidth = (count / total) * width;
    const seg = { x, width: segWidth, color: BOX_COLORS[i] };
    x += segWidth;
    return seg;
  });

  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width={width} height={height} className="flex-shrink-0">
        <rect x={0} y={0} width={width} height={height} rx={2} fill="#f3f4f6" />
        {segments.map((seg, i) => seg.width > 0 && (
          <rect
            key={i}
            x={seg.x}
            y={0}
            width={seg.width}
            height={height}
            rx={i === 0 ? 2 : 0}
            fill={seg.color}
          />
        ))}
        <rect x={0} y={0} width={width} height={height} rx={2} fill="none" stroke="#e5e7eb" strokeWidth={0.5} />
      </svg>
      <span className="text-xs tabular-nums text-gray-500">{masteryPct}%</span>
    </span>
  );
}
