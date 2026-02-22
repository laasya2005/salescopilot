"use client";

export function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    High: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors[risk] || colors.Medium}`}
    >
      {risk} Risk
    </span>
  );
}
