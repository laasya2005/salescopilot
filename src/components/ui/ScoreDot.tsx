export function ScoreDot({ value, className }: { value: number; className?: string }) {
  const color =
    value >= 86 ? "bg-indigo-400" :
    value >= 71 ? "bg-emerald-400" :
    value >= 56 ? "bg-teal-400" :
    value >= 41 ? "bg-yellow-400" :
    value >= 26 ? "bg-orange-400" :
    "bg-rose-400";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}${className ? ` ${className}` : ""}`} />;
}
