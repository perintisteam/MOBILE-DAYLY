import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

export type ActivityDayChartPoint = {
  label: string; // short label
  count: number;
};

export function Activity7DaysChart(props: {
  isDark: boolean;
  width: number;
  data: ActivityDayChartPoint[];
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
      bar: isDark ? '#60a5fa' : '#2563eb',
      axis: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(17,24,39,0.65)',
      line: isDark ? '#a78bfa' : '#7c3aed',
    };
  }, [isDark]);

  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = step * 0.33;

  const linePoints = data
    .map((d, i) => {
      const cx = paddingLeft + i * step + step / 2;
      const h = (d.count / max) * plotHeight;
      const y = paddingTop + (plotHeight - h);
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
          <ClipPath id="activityChartClip">
            <Rect x={0} y={0} width={width} height={height} />
          </ClipPath>
        </Defs>

        <G clipPath="url(#activityChartClip)">
          <Line
            x1={paddingLeft}
            x2={paddingLeft + plotWidth}
            y1={paddingTop + plotHeight}
            y2={paddingTop + plotHeight}
            stroke={colors.axis}
            strokeWidth={1}
          />

          {data.map((d, i) => {
            const h = (d.count / max) * plotHeight;
            const x = paddingLeft + i * step + step / 2 - barWidth / 2;
            const y = paddingTop + (plotHeight - h);
            return <Rect key={d.label} x={x} y={y} width={barWidth} height={h} fill={colors.bar} />;
          })}

          {linePoints ? (
            <Polyline points={linePoints} fill="none" stroke={colors.line} strokeWidth={3} />
          ) : null}

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
