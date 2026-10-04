import React, { useState } from 'react';
import { formatMoney } from '../../utils/formatters';

export interface GraphDataPoint {
  label: string; // e.g. "Jan", "01 Oct", "Today"
  subLabel?: string;
  income: number;
  expense: number;
  profit: number;
  tripsCount?: number;
}

interface ProfitExpenseGraphProps {
  data: GraphDataPoint[];
  currency: string;
  periodLabel: string;
}

export const ProfitExpenseGraph: React.FC<ProfitExpenseGraphProps> = ({
  data,
  currency,
  periodLabel,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // Check if all data is zero
  const hasAnyData = data.some(
    (d) => d.income > 0 || d.expense > 0 || d.profit !== 0
  );

  if (!hasAnyData || data.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
        <span className="text-3xl block">📊</span>
        <p className="font-bold text-slate-700 text-sm">No data to display on graph</p>
        <p className="text-xs text-slate-500">
          Trip charges and recorded expenses for {periodLabel.toLowerCase()} will appear here automatically.
        </p>
      </div>
    );
  }

  // Calculate scales
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense, Math.max(0, d.profit))),
    1000
  );

  const minVal = Math.min(
    ...data.map((d) => Math.min(0, d.profit)),
    0
  );

  const totalRange = maxVal - minVal || 1000;

  // Chart dimensions
  const chartHeight = 220;
  const paddingBottom = 40;
  const paddingTop = 25;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Baseline Y (where value = 0)
  const zeroY = paddingTop + ((maxVal - 0) / totalRange) * plotHeight;

  // Selected or latest data point for preview banner
  const activePoint =
    selectedPointIndex !== null && data[selectedPointIndex]
      ? data[selectedPointIndex]
      : null;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
            <span>📈</span>
            <span>Business Performance Graph</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Comparing Income, Expense and Net Profit
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-green-600 inline-block shadow-2xs"></span>
            <span className="text-green-800">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-red-600 inline-block shadow-2xs"></span>
            <span className="text-red-800">Expense</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block shadow-2xs"></span>
            <span className="text-blue-800">Net Profit</span>
          </div>
        </div>
      </div>

      {/* Interactive Inspector Banner if point selected */}
      {activePoint && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between text-xs animate-fadeIn">
          <div>
            <span className="font-black text-slate-900 block text-sm">
              {activePoint.label} {activePoint.subLabel ? `(${activePoint.subLabel})` : ''}
            </span>
            <span className="text-slate-500 text-[11px]">
              {activePoint.tripsCount !== undefined ? `${activePoint.tripsCount} trips` : ''}
            </span>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-[10px] text-green-700 font-bold uppercase block">Income</span>
              <span className="font-black text-green-600 text-xs">
                {formatMoney(activePoint.income, currency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-red-700 font-bold uppercase block">Expense</span>
              <span className="font-black text-red-600 text-xs">
                {formatMoney(activePoint.expense, currency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Profit</span>
              <span
                className={`font-black text-xs ${
                  activePoint.profit >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}
              >
                {formatMoney(activePoint.profit, currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Bar Graph */}
      <div className="w-full overflow-x-auto pb-1">
        <div style={{ minWidth: data.length > 7 ? `${data.length * 48}px` : '100%' }}>
          <svg
            viewBox={`0 0 ${Math.max(500, data.length * 52)} ${chartHeight}`}
            className="w-full h-56 select-none overflow-visible"
          >
            {/* Grid line at Zero */}
            <line
              x1="0"
              y1={zeroY}
              x2={Math.max(500, data.length * 52)}
              y2={zeroY}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />

            {/* Zero label */}
            <text
              x="5"
              y={zeroY - 4}
              fill="#94a3b8"
              fontSize="9"
              fontWeight="bold"
            >
              0
            </text>

            {/* Max label */}
            <text
              x="5"
              y={paddingTop + 10}
              fill="#94a3b8"
              fontSize="9"
              fontWeight="bold"
            >
              {formatMoney(maxVal, currency)}
            </text>

            {/* Render Bars for each data point */}
            {data.map((d, index) => {
              const svgWidth = Math.max(500, data.length * 52);
              const groupWidth = svgWidth / data.length;
              const groupCenterX = index * groupWidth + groupWidth / 2;

              // Individual bar widths
              const barWidth = Math.max(6, Math.min(13, (groupWidth - 14) / 3));
              const gap = 2;

              // Heights relative to plotHeight
              const incomeHeight = maxVal > 0 ? (d.income / totalRange) * plotHeight : 0;
              const expenseHeight = maxVal > 0 ? (d.expense / totalRange) * plotHeight : 0;
              const profitHeight =
                Math.abs(d.profit) > 0 ? (Math.abs(d.profit) / totalRange) * plotHeight : 0;

              // Y coordinates
              const incomeY = zeroY - incomeHeight;
              const expenseY = zeroY - expenseHeight;
              const profitY = d.profit >= 0 ? zeroY - profitHeight : zeroY;

              const isSelected = selectedPointIndex === index;

              return (
                <g
                  key={index}
                  onClick={() => setSelectedPointIndex(index === selectedPointIndex ? null : index)}
                  className="cursor-pointer group"
                >
                  {/* Subtle hover/active highlight column */}
                  <rect
                    x={index * groupWidth + 2}
                    y={paddingTop - 5}
                    width={groupWidth - 4}
                    height={plotHeight + paddingBottom}
                    fill={isSelected ? '#dbeafe' : 'transparent'}
                    rx="6"
                    className="hover:fill-slate-100 transition-colors"
                  />

                  {/* Income Bar (Green) */}
                  {d.income > 0 && (
                    <rect
                      x={groupCenterX - barWidth * 1.5 - gap}
                      y={incomeY}
                      width={barWidth}
                      height={Math.max(2, incomeHeight)}
                      fill="#16a34a"
                      rx="2"
                      className="transition-all hover:opacity-85"
                    />
                  )}

                  {/* Expense Bar (Red) */}
                  {d.expense > 0 && (
                    <rect
                      x={groupCenterX - barWidth / 2}
                      y={expenseY}
                      width={barWidth}
                      height={Math.max(2, expenseHeight)}
                      fill="#dc2626"
                      rx="2"
                      className="transition-all hover:opacity-85"
                    />
                  )}

                  {/* Net Profit Bar (Blue if >= 0, Red with border if < 0) */}
                  {Math.abs(d.profit) > 0 && (
                    <rect
                      x={groupCenterX + barWidth / 2 + gap}
                      y={profitY}
                      width={barWidth}
                      height={Math.max(2, profitHeight)}
                      fill={d.profit >= 0 ? '#2563eb' : '#ef4444'}
                      rx="2"
                      className="transition-all hover:opacity-85"
                    />
                  )}

                  {/* X-axis Label */}
                  <text
                    x={groupCenterX}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fill={isSelected ? '#1d4ed8' : '#475569'}
                    fontSize={data.length > 10 ? '9' : '10'}
                    fontWeight={isSelected ? '900' : '700'}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center font-medium">
        💡 Tap any bar or column to see detailed figures for that time period.
      </p>
    </div>
  );
};
