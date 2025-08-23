import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  onItemClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'support', 'accountant'] },
    { path: '/customers', label: 'Customers', icon: '👥', roles: ['admin', 'support', 'accountant'] },
    { path: '/plans', label: 'Plans', icon: '📦', roles: ['admin', 'support', 'accountant'] },
    { path: '/subscriptions', label: 'Subscriptions', icon: '🔗', roles: ['admin', 'support', 'accountant'] },
    { path: '/billing', label: 'Billing', icon: '💰', roles: ['admin', 'accountant'] },
    { path: '/network', label: 'Network', icon: '🌐', roles: ['admin', 'support'] },
    { path: '/monitoring', label: 'Monitoring', icon: '📈', roles: ['admin', 'support'] },
    { path: '/users', label: 'Users', icon: '👤', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const handleItemClick = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  return (
    <div className="sidebar">
      {/* Logo and Title */}
      <div className="sidebar__header">
        <h1 className="sidebar__title">ISP Admin Panel</h1>
      </div>

      <hr className="sidebar__divider" />

      {/* User Info */}
      <div className="sidebar__user">
        <div className="sidebar__user-avatar">
          {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="sidebar__user-info">
          <div className="sidebar__user-name">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="sidebar__user-role">
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </div>
        </div>
      </div>

      <hr className="sidebar__divider" />

      {/* Navigation Menu */}
      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          {filteredMenuItems.map((item) => (
            <li key={item.path} className="sidebar__menu-item">
              <button
                className={`sidebar__menu-button ${
                  location.pathname === item.path ? 'sidebar__menu-button--active' : ''
                }`}
                onClick={() => handleItemClick(item.path)}
              >
                <span className="sidebar__menu-icon">{item.icon}</span>
                <span className="sidebar__menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <hr className="sidebar__divider" />

      {/* Settings */}
      <div className="sidebar__footer">
        <button
          className="sidebar__menu-button"
          onClick={() => handleItemClick('/settings')}
        >
          <span className="sidebar__menu-icon">⚙️</span>
          <span className="sidebar__menu-label">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
