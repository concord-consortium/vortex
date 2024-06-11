import React, { useMemo } from 'react';

const width = 40;
const height = 40;
const barWidth = width * 0.5;

interface IBarChartProps {
  min: number;
  max: number;
  value: number;
}

const BarChart: React.FC<IBarChartProps> = ({ min, max, value }) => {

  // Calculate the bar height based on the value
  const barHeight = useMemo(() => {
    value = Math.max(min, Math.min(value, max));
    return ((value - min) / (max - min)) * height;
  }, [min, max, value]);

  const x = (width - barWidth) / 2;

  return (
    <svg width={width} height={height}>
      <line x1={0} y1={0} x2={0} y2={height} stroke="#7fd384" />

      <line x1={0} y1={height} x2={width} y2={height} stroke="#7fd384" />

      <rect
        x={x}
        y={0}
        width={barWidth}
        height={height}
        fill="none"
        stroke="#40be48"
      />

      <rect
        x={x}
        y={height - barHeight}
        width={barWidth}
        height={barHeight}
        fill="#7fd384"
        stroke="#40be48"
      />
    </svg>
  );
};

export default BarChart;
