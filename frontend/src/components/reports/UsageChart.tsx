import React from "react";
import { Card, LineChart } from "@shohojdhara/atomix";

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
  className = "",
  height = 300,
}) => {
  if (isLoading) {
    return (
      <Card title={title} className={`u-h-100 ${className}`}>
        <div
          className="u-flex u-justify-center u-items-center"
          style={{ height: `${height}px` }}
        >
          <div className="u-text-center">
            <div className="u-spinner u-mx-auto u-mb-2"></div>
            <p className="u-text-secondary">Loading chart data...</p>
          </div>
        </div>
      </Card>
    );
  }

  // Transform data for LineChart component
  const chartData = [
    {
      label: title,
      data: data.map((item) => ({
        label: item.label,
        value: item.value,
      })),
      color: "#7AFFD7",
    },
  ];

  return (
    <Card title={title} className={`u-h-100 ${className}`}>
      <div style={{ height: `${height}px` }}>
        <LineChart datasets={chartData} size="lg" />
      </div>
    </Card>
  );
};

export default UsageChart;
