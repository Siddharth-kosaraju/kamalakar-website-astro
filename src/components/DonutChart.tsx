import React, { useState } from 'react';

const DEFAULT_NAMES = ['Hypertension', 'Smoking', 'Diabetes', 'Obesity', 'Other'];
const VALUES = [35, 20, 15, 15, 15];

const COLORS = ['#3B82F6', '#C5A059', '#8B5CF6', '#576CBC', '#A5D7E8'];
const TOTAL = VALUES.reduce((s, v) => s + v, 0);

export default function DonutChart({ centerLabel, riskNames }: { centerLabel: string; riskNames?: string[] }) {
  const names = riskNames && riskNames.length === 5 ? riskNames : DEFAULT_NAMES;
  const RISK_DATA = names.map((name, i) => ({ name, value: VALUES[i] }));
  const [active, setActive] = useState<number | null>(null);
  const cx = 150, cy = 150;
  const outerR = 120, innerR = 80;
  const gap = 0.04;

  let cumAngle = -Math.PI / 2;
  const arcs = RISK_DATA.map((d, i) => {
    const sweep = (d.value / TOTAL) * Math.PI * 2;
    const a1 = cumAngle + gap / 2;
    const a2 = cumAngle + sweep - gap / 2;
    cumAngle += sweep;
    const isActive = active === i;
    const r = isActive ? outerR + 8 : outerR;
    const large = sweep - gap > Math.PI ? 1 : 0;
    const path = [
      `M${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`,
      `A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}`,
      `L${cx + innerR * Math.cos(a2)},${cy + innerR * Math.sin(a2)}`,
      `A${innerR},${innerR} 0 ${large} 0 ${cx + innerR * Math.cos(a1)},${cy + innerR * Math.sin(a1)}`,
      'Z',
    ].join(' ');
    return { path, color: COLORS[i], name: d.name, value: d.value };
  });

  const item = active !== null ? arcs[active] : null;

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full max-w-[350px] mx-auto" role="img" aria-label="Heart disease risk factors chart">
      {arcs.map((arc, i) => (
        <path
          key={i}
          d={arc.path}
          fill={arc.color}
          className="transition-all duration-200 cursor-pointer outline-none"
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
        />
      ))}
      <text x={cx} y={item ? cy - 8 : cy} textAnchor="middle" dominantBaseline="middle" className="fill-primary dark:fill-white font-bold font-serif select-none" style={{ fontSize: 16 }}>
        {item ? item.name : centerLabel}
      </text>
      {item && (
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 dark:fill-gray-300 font-semibold select-none" style={{ fontSize: 14 }}>
          {item.value}%
        </text>
      )}
    </svg>
  );
}
