'use client';

import React from 'react';
import styles from './style.module.scss';

interface ChartDataItem {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface CircularChartProps {
  data: ChartDataItem[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const CircularChart: React.FC<CircularChartProps> = ({
  data,
  size = 200,
  strokeWidth = 16,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // データのバリデーション
  if (!data || data.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.emptyState}>
          <p>データがありません</p>
        </div>
      </div>
    );
  }

  // 累積パーセンテージを計算（円グラフの開始位置用）
  let cumulativePercentage = 0;
  const dataWithOffset = data.map(item => {
    const offset = cumulativePercentage;
    cumulativePercentage += item.percentage;
    return {
      ...item,
      offset
    };
  });

  // SVGパスを生成する関数
  const createArcPath = (percentage: number, offset: number): string => {
    const angle = (percentage / 100) * 360;
    const startAngle = (offset / 100) * 360 - 90; // -90度で12時方向から開始
    const endAngle = startAngle + angle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    if (percentage >= 100) {
      // 完全な円の場合
      return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.1} ${center - radius}`;
    }

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.chartWrapper}>
        <svg width={size} height={size} className={styles.chart}>
          {/* 背景円 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-gray-200)"
            strokeWidth={2}
          />

          {/* データセグメント */}
          {dataWithOffset.map((item, index) => {
            // テキスト表示位置を計算
            const midAngle = ((item.offset + item.percentage / 2) / 100) * 360 - 90;
            const midAngleRad = (midAngle * Math.PI) / 180;
            const textRadius = radius * 0.75; // 円の75%の位置
            const textX = center + textRadius * Math.cos(midAngleRad);
            const textY = center + textRadius * Math.sin(midAngleRad);

            return (
              <g key={index}>
                <path
                  d={createArcPath(item.percentage, item.offset)}
                  fill={item.color}
                  className={styles.chartSegment}
                  data-label={item.label}
                />
                {/* カテゴリラベルとパーセンテージをパイスライス上に表示 */}
                <text
                  x={textX}
                  y={textY - 8}
                  textAnchor="middle"
                  className={styles.labelText}
                  fill="white"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {item.label}
                </text>
                <text
                  x={textX}
                  y={textY + 8}
                  textAnchor="middle"
                  className={styles.percentageText}
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {item.percentage.toFixed(1)}%
                </text>
              </g>
            );
          })}

        </svg>
      </div>

    </div>
  );
};

export default CircularChart;