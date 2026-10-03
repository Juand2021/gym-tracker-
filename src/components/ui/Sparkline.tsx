import { useId } from "react";

/** Mini gráfica de línea con relleno; `values` va del más antiguo al más reciente. */
export function Sparkline({
  values,
  width = 120,
  height = 40,
  className = "hm-spark",
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const fillId = useId();
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - 4 - ((v - min) / span) * (height - 8),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7a45" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff7a45" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#${fillId})`} />
      <path d={line} fill="none" stroke="#ff8a55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.2" fill="#fff" stroke="#ff6a2c" strokeWidth="2" />
    </svg>
  );
}
