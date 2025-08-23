import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const handleProfileMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotificationMenu(false);
  };

  const handleNotificationMenuToggle = () => {
    setShowNotificationMenu(!showNotificationMenu);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <div className="header">
      {/* Page Title */}
      <div className="header__title">
        <h2>Welcome back, {user?.first_name || user?.username}!</h2>
      </div>

      {/* Header Actions */}
      <div className="header__actions">
        {/* Notifications */}
        <button
          className="header__notification-button"
          onClick={handleNotificationMenuToggle}
          aria-label="Notifications"
        >
          <span className="header__notification-icon">🔔</span>
          <span className="header__notification-badge">3</span>
        </button>

        {/* Profile Menu */}
        <button
          className="header__profile-button"
          onClick={handleProfileMenuToggle}
          aria-label="Profile menu"
        >
          <div className="header__profile-avatar">
            {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
          </div>
        </button>
      </div>

      {/* Notification Menu */}
      {showNotificationMenu && (
        <div className="header__notification-menu">
          <div className="header__notification-header">
            <h3>Notifications</h3>
          </div>
          <hr />
          <div className="header__notification-item">
            <div className="header__notification-content">
              <div className="header__notification-text">New customer registered</div>
              <div className="header__notification-time">2 minutes ago</div>
            </div>
          </div>
          <div className="header__notification-item">
            <div className="header__notification-content">
              <div className="header__notification-text">Invoice payment received</div>
              <div className="header__notification-time">1 hour ago</div>
            </div>
          </div>
          <div className="header__notification-item">
            <div className="header__notification-content">
              <div className="header__notification-text">Router offline: Main Router</div>
              <div className="header__notification-time">3 hours ago</div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Menu */}
      {showProfileMenu && (
        <div className="header__profile-menu">
          <div className="header__profile-info">
            <div className="header__profile-name">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="header__profile-email">{user?.email}</div>
            <div className="header__profile-role">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </div>
          </div>
          <hr />
          <button className="header__profile-menu-item">
            <span className="header__profile-menu-icon">👤</span>
            Profile
          </button>
          <button className="header__profile-menu-item">
            <span className="header__profile-menu-icon">⚙️</span>
            Account Settings
          </button>
          <hr />
          <button className="header__profile-menu-item" onClick={handleLogout}>
            <span className="header__profile-menu-icon">🚪</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
