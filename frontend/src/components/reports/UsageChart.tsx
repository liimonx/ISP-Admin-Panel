import React from 'react';
import { Card, LineChart } from '@shohojdhara/atomix';

export interface UsageChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
  }>;
  isLoading?: boolean;
  className?: string;
  height?: number;
}

/**
 * UsageChart Component
 * 
 * A chart component for displaying usage trends over time.
 * Built using Atomix Card and LineChart components.
 */
export const UsageChart: React.FC<UsageChartProps> = ({
  title,
  data,
  isLoading = false,
  className = '',
  height = 300,
}) => {
  if (isLoading) {
    return (
      <Card className={`u-h-100 ${className}`}>
        <div className="u-p-4">
          <h3 className="u-text-lg u-fw-semibold u-mb-4">{title}</h3>
          <div className="u-d-flex u-justify-content-center u-align-items-center" style={{ height: `${height}px` }}>
            <div className="u-text-center">
              <div className="u-spinner u-mx-auto u-mb-2"></div>
              <p className="u-text-muted">Loading chart data...</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Transform data for LineChart component
  const chartData = [
    {
      label: title,
      data: data.map(item => ({
        label: item.label,
        value: item.value,
      })),
      color: '#7AFFD7',
    },
  ];

  return (
    <Card className={`u-h-100 ${className}`}>
      <div className="u-p-4">
        <h3 className="u-text-lg u-fw-semibold u-mb-4">{title}</h3>
        <div style={{ height: `${height}px` }}>
          <LineChart datasets={chartData} size="lg" />
        </div>
      </div>
    </Card>
  );
};

export default UsageChart;