"use client";

export function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    High: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };

  return (
    <span
      role="status"
      aria-label={`Deal risk: ${risk}`}
      className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors[risk] || colors.Medium}`}
    >
      {risk} Risk
    </span>
  );
}
