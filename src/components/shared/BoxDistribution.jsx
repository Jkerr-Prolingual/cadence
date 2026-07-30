const BOX_COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];

export default function BoxDistribution({ cards }) {
  const boxes = [1, 2, 3, 4, 5];
  const counts = boxes.map(b => cards.filter(c => c.box === b).length);
  const max = Math.max(...counts, 1);

  return (
    <div className="flex items-end gap-2 h-24">
      {boxes.map((box, i) => (
        <div key={box} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{counts[i]}</span>
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max((counts[i] / max) * 100, 4)}%`,
              backgroundColor: counts[i] > 0 ? BOX_COLORS[i] : '#e5e7eb',
            }}
          />
          <span className="text-xs text-gray-400">{box}</span>
        </div>
      ))}
    </div>
  );
}
