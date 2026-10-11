export function JevScoreDisplay({ score }: { score: number }) {
  const rounded = Math.min(Math.max(Math.round(score), 0), 5);

  return (
    <div className="flex flex-col gap-1 min-w-[96px]">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-zinc-500 uppercase tracking-wider">JEV RISK</span>
        <span className="text-zinc-200 font-medium">{score.toFixed(1)}/5.0</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-sm transition-colors ${
              level <= rounded ? "bg-white" : "bg-zinc-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
