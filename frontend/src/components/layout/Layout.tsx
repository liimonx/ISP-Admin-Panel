import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="layout__header">
        <div className="layout__header-content">
          <button
            className="layout__menu-button"
            onClick={handleDrawerToggle}
            aria-label="Toggle menu"
          >
            <span className="layout__menu-icon">☰</span>
          </button>
          <Header />
        </div>
      </header>

      {/* Sidebar */}
      <nav className={`layout__sidebar ${mobileOpen ? 'layout__sidebar--open' : ''}`}>
        <Sidebar onItemClick={() => setMobileOpen(false)} />
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="layout__overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
