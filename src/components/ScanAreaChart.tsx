import React, { useState } from 'react';
import type { ScanPoint } from '../types';

interface ScanAreaChartProps {
  data: ScanPoint[];
}

export function ScanAreaChart({ data }: ScanAreaChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-500">
        Aún no hay lecturas registradas en el período.
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padLeft = 36;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 30;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxVal = Math.max(8, ...data.map((d) => d.total));
  const yStep = Math.ceil(maxVal / 4);
  const yMax = yStep * 4;

  const xPos = (idx: number) =>
    data.length === 1 ? padLeft + innerW / 2 : padLeft + (idx / (data.length - 1)) * innerW;
  const yPos = (val: number) => padTop + innerH - (val / yMax) * innerH;

  const totalPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(d.total).toFixed(1)}`)
    .join(' ');

  const areaPath = `${totalPath} L ${xPos(data.length - 1).toFixed(1)} ${(
    padTop + innerH
  ).toFixed(1)} L ${xPos(0).toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;

  const nfcPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(d.nfc).toFixed(1)}`)
    .join(' ');

  const activePoint = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="relative select-none">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-blue-400 inline-block" />
            <span>Lecturas totales (QR + NFC)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
            <span>Toques NFC</span>
          </span>
        </div>
        {activePoint ? (
          <span className="font-mono tabular-nums text-slate-200">
            {activePoint.label}: {activePoint.total} ({activePoint.qr} QR · {activePoint.nfc} NFC)
          </span>
        ) : (
          <span className="text-slate-500">Últimos 14 días</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-56 overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="dpAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 1, 2, 3, 4].map((step) => {
          const val = step * yStep;
          const y = yPos(val);
          return (
            <g key={step}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#1E293B"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[10px] font-mono"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area & lines */}
        <path d={areaPath} fill="url(#dpAreaGrad)" />
        <path
          d={totalPath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={nfcPath}
          fill="none"
          stroke="#10B981"
          strokeWidth="1.75"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X axis labels (every 2-3 days) */}
        {data.map((d, i) => {
          const showLabel = i === 0 || i === data.length - 1 || i % 3 === 0;
          if (!showLabel) return null;
          return (
            <text
              key={d.date}
              x={xPos(i)}
              y={height - 6}
              textAnchor="middle"
              className="fill-slate-500 text-[10px] font-mono"
            >
              {d.label}
            </text>
          );
        })}

        {/* Hover targets & active point */}
        {hoverIdx !== null && (
          <g>
            <line
              x1={xPos(hoverIdx)}
              y1={padTop}
              x2={xPos(hoverIdx)}
              y2={padTop + innerH}
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={xPos(hoverIdx)}
              cy={yPos(data[hoverIdx].total)}
              r="4.5"
              fill="#3B82F6"
              stroke="#0E1628"
              strokeWidth="2"
            />
            <circle
              cx={xPos(hoverIdx)}
              cy={yPos(data[hoverIdx].nfc)}
              r="3.5"
              fill="#10B981"
              stroke="#0E1628"
              strokeWidth="1.5"
            />
          </g>
        )}

        {data.map((d, i) => {
          const colW = innerW / Math.max(data.length - 1, 1);
          return (
            <rect
              key={d.date}
              x={xPos(i) - colW / 2}
              y={padTop}
              width={colW}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              className="cursor-crosshair"
            />
          );
        })}
      </svg>
    </div>
  );
}
