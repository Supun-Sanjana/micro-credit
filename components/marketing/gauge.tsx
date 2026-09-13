import React from "react";

export function Gauge({
  value,
  color = "#7c3aed",
  showLabels = false,
  min = 0,
  max = 100
}: {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: number;
  max?: number;
}) {
  const totalTicks = 40;
  const activeCount = Math.round((value / 100) * totalTicks);
  const cx = 100;
  const cy = 100;
  const rOuter = 80;
  const rInner = 70;

  return (
    <div className="w-full max-w-[260px] mx-auto flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full overflow-visible">
        {Array.from({ length: totalTicks }).map((_, i) => {
          // Arc from p (180deg) to 2p (360deg)
          const angle = Math.PI + (i / (totalTicks - 1)) * Math.PI;
          
          const x1 = cx + rInner * Math.cos(angle);
          const y1 = cy + rInner * Math.sin(angle);
          const x2 = cx + rOuter * Math.cos(angle);
          const y2 = cy + rOuter * Math.sin(angle);
          
          const isActive = i < activeCount;
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isActive ? color : "#d4d4d8"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
        
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fontSize="22"
          fontWeight="600"
          fill="#17191c"
        >
          {value}%
        </text>
      </svg>
      
      {showLabels && (
        <div className="flex w-full justify-between px-6 -mt-2">
          <span className="text-[11px] text-neutral-500 font-medium">{min}</span>
          <span className="text-[11px] text-neutral-500 font-medium">{max}</span>
        </div>
      )}
    </div>
  );
}
