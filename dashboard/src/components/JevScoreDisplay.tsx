export function JevScoreDisplay({ score }: { score: number }) {
  const clamped = Math.min(Math.max(score, 0), 5);
  const pct = (clamped / 5) * 100;

  // Color shifts based on continuous value
  const barColor =
    clamped >= 4.0
      ? "bg-zinc-100"          // very high risk — bright white
      : clamped >= 3.0
      ? "bg-zinc-300"          // elevated risk
      : clamped >= 2.0
      ? "bg-zinc-500"          // moderate risk
      : "bg-zinc-600";         // low risk — dim

  const textColor =
    clamped >= 4.0
      ? "text-white"
      : clamped >= 3.0
      ? "text-zinc-200"
      : clamped >= 2.0
      ? "text-zinc-400"
      : "text-zinc-500";

  return (
    <div className="flex flex-col gap-1.5 min-w-[108px]">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-zinc-500 uppercase tracking-wider">JEV RISK</span>
        <span className={`font-semibold tabular-nums ${textColor}`}>
          {clamped.toFixed(2)}
          <span className="text-zinc-600 font-normal">/5.0</span>
        </span>
      </div>
      {/* Continuous fill bar — fraction of 5.0 */}
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
