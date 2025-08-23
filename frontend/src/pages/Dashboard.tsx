import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => (
  <div className="stat-card">
    <div className="stat-card__content">
      <div className="stat-card__info">
        <div className="stat-card__title">{title}</div>
        <div className="stat-card__value">{value}</div>
        {trend && (
          <div className="stat-card__trend">
            <span className={`stat-card__trend-icon ${trend.isPositive ? 'stat-card__trend-icon--positive' : 'stat-card__trend-icon--negative'}`}>
              {trend.isPositive ? '📈' : '📉'}
            </span>
            <span className={`stat-card__trend-value ${trend.isPositive ? 'stat-card__trend-value--positive' : 'stat-card__trend-value--negative'}`}>
              {trend.value}%
            </span>
          </div>
        )}
      </div>
      <div className="stat-card__icon" style={{ backgroundColor: `${color}20`, color: color }}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiService.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Dashboard</h1>
      <p className="dashboard__subtitle">
        Welcome to your ISP Admin Panel. Here's an overview of your operations.
      </p>

      {/* Stats Grid */}
      <div className="dashboard__stats">
        <div className="dashboard__stat-item">
          <StatCard
            title="Total Customers"
            value={stats?.total_customers || 0}
            icon="👥"
            color="#7AFFD7"
            trend={{
              value: 12,
              isPositive: true,
            }}
          />
        </div>
        <div className="dashboard__stat-item">
          <StatCard
            title="Active Subscriptions"
            value={stats?.total_subscriptions || 0}
            icon="🔗"
            color="#1AFFD2"
            trend={{
              value: 8,
              isPositive: true,
            }}
          />
        </div>
        <div className="dashboard__stat-item">
          <StatCard
            title="Online Routers"
            value={`${stats?.online_routers || 0}/${stats?.total_routers || 0}`}
            icon="🌐"
            color="#00E6C3"
            trend={{
              value: 2,
              isPositive: false,
            }}
          />
        </div>
        <div className="dashboard__stat-item">
          <StatCard
            title="Monthly Revenue"
            value={`$${stats?.total_monthly_revenue?.toLocaleString() || 0}`}
            icon="💰"
            color="#4DFF9F"
            trend={{
              value: 15,
              isPositive: true,
            }}
          />
        </div>
      </div>

      {/* Charts and Additional Info */}
      <div className="dashboard__content">
        <div className="dashboard__chart-section">
          <div className="dashboard__chart-card">
            <h2 className="dashboard__chart-title">Revenue Overview</h2>
            <div className="dashboard__chart-placeholder">
              Revenue Chart (Implementation needed with recharts)
            </div>
          </div>
        </div>
        <div className="dashboard__activity-section">
          <div className="dashboard__activity-card">
            <h2 className="dashboard__activity-title">Recent Activity</h2>
            <div className="dashboard__activity-list">
              <div className="dashboard__activity-item">
                <div className="dashboard__activity-text">New customer registered</div>
                <div className="dashboard__activity-time">John Doe - 2 minutes ago</div>
              </div>
              <div className="dashboard__activity-item">
                <div className="dashboard__activity-text">Invoice payment received</div>
                <div className="dashboard__activity-time">Jane Smith - $50.00 - 1 hour ago</div>
              </div>
              <div className="dashboard__activity-item">
                <div className="dashboard__activity-text">Router status changed</div>
                <div className="dashboard__activity-time">Main Router - Online - 2 hours ago</div>
              </div>
              <div className="dashboard__activity-item">
                <div className="dashboard__activity-text">New subscription created</div>
                <div className="dashboard__activity-time">Premium Plan - 3 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard__actions">
        <div className="dashboard__actions-card">
          <h2 className="dashboard__actions-title">Quick Actions</h2>
          <div className="dashboard__actions-grid">
            <div className="dashboard__action-item">
              <div className="dashboard__action-icon">👥</div>
              <h3 className="dashboard__action-title">Add Customer</h3>
              <p className="dashboard__action-description">Register a new customer</p>
            </div>
            <div className="dashboard__action-item">
              <div className="dashboard__action-icon">🔗</div>
              <h3 className="dashboard__action-title">New Subscription</h3>
              <p className="dashboard__action-description">Create subscription</p>
            </div>
            <div className="dashboard__action-item">
              <div className="dashboard__action-icon">🌐</div>
              <h3 className="dashboard__action-title">Monitor Network</h3>
              <p className="dashboard__action-description">Check router status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
