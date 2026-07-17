export function MoodChart({
  data,
}: {
  data: { date: string; score: number; stress: number }[];
}) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
        暂无情绪曲线，先完成几次打卡吧
      </div>
    );
  }

  const max = 5;
  const w = 560;
  const h = 160;
  const pad = 16;
  const points = data.map((d, i) => {
    const x =
      pad + (i * (w - pad * 2)) / Math.max(data.length - 1, 1);
    const y = h - pad - ((d.score - 1) / (max - 1)) * (h - pad * 2);
    return `${x},${y}`;
  });
  const stressPoints = data.map((d, i) => {
    const x =
      pad + (i * (w - pad * 2)) / Math.max(data.length - 1, 1);
    const y = h - pad - ((d.stress - 1) / (max - 1)) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full min-w-[320px]">
        {[1, 2, 3, 4, 5].map((n) => {
          const y = h - pad - ((n - 1) / 4) * (h - pad * 2);
          return (
            <line
              key={n}
              x1={pad}
              x2={w - pad}
              y1={y}
              y2={y}
              stroke="#e7e5e4"
              strokeDasharray="4 4"
            />
          );
        })}
        <polyline
          fill="none"
          stroke="#f97316"
          strokeWidth="2.5"
          points={stressPoints.join(" ")}
        />
        <polyline
          fill="none"
          stroke="#0f766e"
          strokeWidth="3"
          points={points.join(" ")}
        />
        {data.map((d, i) => {
          const x =
            pad + (i * (w - pad * 2)) / Math.max(data.length - 1, 1);
          const y = h - pad - ((d.score - 1) / 4) * (h - pad * 2);
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#0f766e" />;
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-teal-700" /> 情绪
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" /> 压力
        </span>
      </div>
    </div>
  );
}
