"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h2 className="text-xl text-red-400 font-semibold">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm"
      >
        Try again
      </button>
    </div>
  );
}
