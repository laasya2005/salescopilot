"use client";

export function ScoreRing({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[80px] h-[80px] sm:w-[100px] sm:h-[100px]">
        <svg
          viewBox="0 0 100 100"
          className="-rotate-90 w-full h-full"
          role="img"
          aria-label={`${label}: ${value} out of 100`}
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-white">{value}</span>
        </div>
      </div>
      <span className="text-sm text-slate-400 font-medium">{label}</span>
    </div>
  );
}
