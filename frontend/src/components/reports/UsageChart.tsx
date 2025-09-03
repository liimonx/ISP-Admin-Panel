import React from "react";
import { Card, Icon } from "@shohojdhara/atomix";

interface UsageChartProps {
  title: string;
  data: Array<{
    period: string;
    value: number;
    label?: string;
  }>;
  type?: "line" | "bar" | "area";
  isLoading?: boolean;
}

const UsageChart: React.FC<UsageChartProps> = ({
  title,
  data,
  type = "line",
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="u-border-0 u-shadow-sm">
        <div className="u-p-4 u-border-b u-border-secondary-subtle">
          <h3 className="u-fs-4 u-fw-semibold u-mb-0">{title}</h3>
        </div>
        <div className="u-p-6">
          <div className="u-text-center u-py-8">
            <div className="u-bg-secondary u-rounded u-h-48 u-w-100"></div>
          </div>
        </div>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card className="u-border-0 u-shadow-sm">
      <div className="u-p-4 u-border-b u-border-secondary-subtle">
        <div className="u-d-flex u-align-items-center u-gap-2">
          <Icon name="ChartLine" size={20} className="u-text-primary-emphasis" />
          <h3 className="u-fs-4 u-fw-semibold u-mb-0">{title}</h3>
        </div>
      </div>
      <div className="u-p-6">
        {data.length === 0 ? (
          <div className="u-text-center u-py-8">
            <Icon name="ChartBar" size={48} className="u-text-secondary u-mb-3" />
            <p className="u-text-secondary-emphasis">No data available</p>
          </div>
        ) : (
          <div className="u-d-flex u-align-items-end u-gap-2 u-h-48">
            {data.map((item, index) => (
              <div key={index} className="u-flex-grow-1 u-d-flex u-flex-column u-align-items-center u-gap-2">
                <div 
                  className="u-bg-primary u-rounded-top u-w-100 u-position-relative"
                  style={{ 
                    height: `${(item.value / maxValue) * 100}%`,
                    minHeight: "4px"
                  }}
                  title={`${item.period}: ${item.value}${item.label || ''}`}
                />
                <span className="u-fs-xs u-text-secondary-emphasis u-text-center">
                  {item.period}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default UsageChart;