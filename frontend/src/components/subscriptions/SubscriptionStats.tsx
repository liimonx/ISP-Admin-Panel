import React from "react";
import { Card, Icon } from "@shohojdhara/atomix";
import { Subscription } from "../../types";

interface SubscriptionStatsProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
}

const SubscriptionStats: React.FC<SubscriptionStatsProps> = ({
  subscriptions,
  isLoading,
}) => {
  const stats = React.useMemo(() => {
    if (!subscriptions.length) {
      return {
        total: 0,
        active: 0,
        suspended: 0,
        cancelled: 0,
        pending: 0,
        totalRevenue: 0,
      };
    }

    return subscriptions.reduce(
      (acc, sub) => {
        acc.total++;
        acc[sub.status]++;
        if (sub.status === "active") {
          acc.totalRevenue += Number(sub.monthly_fee) || 0;
        }
        return acc;
      },
      {
        total: 0,
        active: 0,
        suspended: 0,
        cancelled: 0,
        pending: 0,
        totalRevenue: 0,
      }
    );
  }, [subscriptions]);

  const statCards = [
    {
      title: "Total Subscriptions",
      value: stats.total,
      icon: "Users",
      color: "primary",
      bgClass: "u-bg-primary-subtle",
      textClass: "u-text-primary-emphasis",
    },
    {
      title: "Active",
      value: stats.active,
      icon: "CheckCircle",
      color: "success",
      bgClass: "u-bg-success-subtle",
      textClass: "u-text-success-emphasis",
    },
    {
      title: "Suspended",
      value: stats.suspended,
      icon: "Pause",
      color: "warning",
      bgClass: "u-bg-warning-subtle",
      textClass: "u-text-warning-emphasis",
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: "CurrencyDollar",
      color: "info",
      bgClass: "u-bg-info-subtle",
      textClass: "u-text-info-emphasis",
    },
  ];

  if (isLoading) {
    return (
      <div className="u-d-grid u-gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="u-p-4">
            <div className="u-d-flex u-align-items-center u-gap-3">
              <div className="u-bg-secondary-subtle u-rounded-circle u-p-3">
                <div className="u-w-6 u-h-6 u-bg-secondary u-rounded"></div>
              </div>
              <div className="u-flex-grow-1">
                <div className="u-bg-secondary u-rounded u-h-4 u-mb-2" style={{ width: "60%" }}></div>
                <div className="u-bg-secondary u-rounded u-h-6" style={{ width: "40%" }}></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="u-d-grid u-gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
      {statCards.map((stat, index) => (
        <Card key={index} className="u-p-4 u-border-0 u-shadow-sm">
          <div className="u-d-flex u-align-items-center u-gap-3">
            <div className={`${stat.bgClass} u-rounded-circle u-p-3 u-d-flex u-align-items-center u-justify-content-center`}>
              <Icon name={stat.icon as any} size={24} className={stat.textClass} />
            </div>
            <div className="u-flex-grow-1">
              <p className="u-text-secondary-emphasis u-fs-sm u-mb-1">{stat.title}</p>
              <h3 className="u-fs-2 u-fw-bold u-mb-0 u-text-primary-emphasis">{stat.value}</h3>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionStats;