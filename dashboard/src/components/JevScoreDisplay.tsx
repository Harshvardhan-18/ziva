export function JevScoreDisplay({ score }: { score: number }) {
  // Score is typically 0 to 5.
  // 0-2: Low Risk (Green)
  // 2-3.5: Medium Risk (Yellow)
  // 3.5-5: High Risk (Red)

  let colorClass = "bg-emerald-500";
  let textClass = "text-emerald-500";
  if (score >= 3.5) {
    colorClass = "bg-red-500";
    textClass = "text-red-500";
  } else if (score >= 2) {
    colorClass = "bg-amber-500";
    textClass = "text-amber-500";
  }

  const percentage = Math.min(Math.max((score / 5) * 100, 0), 100);

  return (
    <div className="flex flex-col gap-1 w-full max-w-[120px]">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-300">JEV Score</span>
        <span className={`font-bold ${textClass}`}>{score.toFixed(1)}/5.0</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
