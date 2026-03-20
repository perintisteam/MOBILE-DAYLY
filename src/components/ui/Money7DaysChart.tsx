import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

export type MoneyDayChartPoint = {
  label: string; // short label
  income: number;
  expense: number;
  net: number;
};

export function Money7DaysChart(props: {
  isDark: boolean;
  width: number;
  data: MoneyDayChartPoint[];
}) {
  const { isDark, width, data } = props;

  const height = 190;
  const paddingLeft = 44;
  const paddingRight = 16;
  const paddingTop = 12;
  const paddingBottom = 30;

  const plotWidth = Math.max(1, width - paddingLeft - paddingRight);
  const plotHeight = height - paddingTop - paddingBottom;
  const n = Math.max(1, data.length);
  const step = plotWidth / n;

  const colors = useMemo(() => {
    return {
      income: isDark ? '#34d399' : '#16a34a',
      expense: isDark ? '#fb7185' : '#dc2626',
      axis: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(17,24,39,0.65)',
      net: isDark ? '#a78bfa' : '#7c3aed',
      grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
    };
  }, [isDark]);

  const maxAbsNet = Math.max(
    1,
    ...data.map((d) => Math.max(Math.abs(d.net), Math.abs(d.income), Math.abs(d.expense)))
  );
  const maxPos = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));

  const zeroY = paddingTop + plotHeight / 2;
  const barWidth = step * 0.28;
  const incomeXOffset = step * 0.18;
  const expenseXOffset = step * 0.48;

  const netPoints = data
    .map((d, i) => {
      const cx = paddingLeft + i * step + step / 2;
      const y = zeroY - (d.net / (maxAbsNet * 2)) * plotHeight; // map -max..max to ~half height
      return `${cx},${y}`;
    })
    .join(' ');

  const xLabels = data
    .map((d, i) => {
      const show = i === 0 || i === Math.floor((n - 1) / 2) || i === n - 1;
      if (!show) return null;
      const cx = paddingLeft + i * step + step / 2;
      const clampedCx = Math.max(paddingLeft, Math.min(paddingLeft + plotWidth, cx));
      return { cx: clampedCx, label: d.label };
    })
    .filter(Boolean) as { cx: number; label: string }[];

  return (
    <View style={{ width, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Defs>
          <ClipPath id="moneyChartClip">
            <Rect x={0} y={0} width={width} height={height} />
          </ClipPath>
        </Defs>

        <G clipPath="url(#moneyChartClip)">
          {/* baseline */}
          <Line
            x1={paddingLeft}
            x2={paddingLeft + plotWidth}
            y1={zeroY}
            y2={zeroY}
            stroke={colors.axis}
            strokeWidth={1}
          />

          {/* bars */}
          {data.map((d, i) => {
            const groupLeft = paddingLeft + i * step;
            const incH = (d.income / maxPos) * plotHeight;
            const expH = (d.expense / maxPos) * plotHeight;

            const incX = groupLeft + incomeXOffset;
            const expX = groupLeft + expenseXOffset;

            const incY = paddingTop + (plotHeight - incH);
            const expY = paddingTop + (plotHeight - expH);

            return (
              <React.Fragment key={d.label}>
                <Rect x={incX} y={incY} width={barWidth} height={incH} fill={colors.income} />
                <Rect x={expX} y={expY} width={barWidth} height={expH} fill={colors.expense} />
              </React.Fragment>
            );
          })}

          {/* net line */}
          {netPoints ? (
            <Polyline points={netPoints} fill="none" stroke={colors.net} strokeWidth={3} />
          ) : null}

          {/* x labels */}
          {xLabels.map((l) => (
            <SvgText
              key={l.label}
              x={l.cx}
              y={height - 10}
              fill={colors.axis}
              fontSize={10}
              fontWeight={700}
              textAnchor="middle">
              {l.label}
            </SvgText>
          ))}
        </G>
      </Svg>
    </View>
  );
}
