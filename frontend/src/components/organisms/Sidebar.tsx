import React, { useState, useEffect } from "react";
import {
  SideMenu,
  SideMenuList,
  SideMenuItem,
  Icon,
  Badge,
  Button,
  Avatar,
  IconProps,
  Tooltip,
} from "@shohojdhara/atomix";
import { useLocation, useNavigate } from "react-router-dom";

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  className?: string;
  "data-testid"?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: IconProps | string;
  path?: string;
  badge?: {
    text: string;
    variant: "primary" | "secondary" | "success" | "warning" | "error";
  };
  children?: MenuItem[];
  disabled?: boolean;
  tooltip?: string;
  category?: string;
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "ChartBar",
    path: "/",
    category: "main",
    tooltip: "Overview and analytics",
  },
  {
    id: "customers",
    label: "Customers",
    icon: "Users",
    path: "/customers",
    category: "main",
    badge: {
      text: "245",
      variant: "primary",
    },
    tooltip: "Customer management",
  },
  {
    id: "services",
    label: "Services",
    icon: "Globe",
    category: "services",
    tooltip: "Service management",
    children: [
      {
        id: "plans",
        label: "Internet Plans",
        icon: "Lightning",
        path: "/plans",
        tooltip: "Manage internet plans",
      },
      {
        id: "subscriptions",
        label: "Subscriptions",
        icon: "CreditCard",
        path: "/subscriptions",
        tooltip: "Active subscriptions",
      },
      {
        id: "router-management",
        label: "Router Management",
        icon: "Router",
        path: "/routers",
        tooltip: "Manage network routers",
      },
    ],
  },
  {
    id: "network",
    label: "Network",
    icon: "Share",
    category: "network",
    tooltip: "Network operations",
    children: [
      {
        id: "monitoring",
        label: "Monitoring",
        icon: "Monitor",
        path: "/monitoring",
        badge: {
          text: "3",
          variant: "warning",
        },
        tooltip: "Network monitoring",
      },
      {
        id: "devices",
        label: "Network Devices",
        icon: "DeviceMobile",
        path: "/network",
        tooltip: "Network device management",
      },
      {
        id: "main-router",
        label: "Main Router",
        icon: "Router",
        path: "/main-router",
        tooltip: "Main router dashboard",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: "Receipt",
    path: "/billing",
    category: "financial",
    tooltip: "Billing and payments",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "ChartPie",
    category: "analytics",
    tooltip: "Reports and analytics",
    children: [
      {
        id: "usage",
        label: "Usage Reports",
        icon: "ChartLine",
        path: "/reports/usage",
        tooltip: "Usage analytics",
      },
      {
        id: "revenue",
        label: "Revenue Reports",
        icon: "CurrencyDollar",
        path: "/reports/revenue",
        tooltip: "Revenue analytics",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Gear",
    category: "system",
    tooltip: "System configuration",
    children: [
      {
        id: "users",
        label: "User Management",
        icon: "PersonPlus",
        path: "/users",
        tooltip: "Manage system users",
      },
      {
        id: "system",
        label: "System Settings",
        icon: "Wrench",
        path: "/settings/system",
        tooltip: "System configuration",
      },
    ],
  },
];

/**
 * Sidebar Organism
 *
 * A comprehensive sidebar navigation component with collapsible sections,
 * nested menu items, and user information display.
 * Built using Atomix SideMenu components following atomic design principles.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggle,
  user,
  className = "",
  "data-testid": testId,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "services",
    "network",
  ]);

  // Auto-expand sections based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpandedSections: string[] = [];
    
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.path === currentPath
        );
        if (hasActiveChild) {
          newExpandedSections.push(item.id);
        }
      }
    });
    
    if (newExpandedSections.length > 0) {
      setExpandedSections(newExpandedSections);
    }
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (children: MenuItem[]) => {
    return children.some((child) => child.path && isActive(child.path));
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.children) {
      toggleSection(item.id);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const active = item.path
      ? isActive(item.path)
      : hasChildren && isParentActive(item.children!);

    const menuItemContent = (
      <SideMenuItem
        icon={<Icon name={item.icon as any} size={20} />}
        active={active}
        onClick={() => handleMenuClick(item)}
        disabled={item.disabled}
        className={`${level > 0 ? "u-ps-8" : ""} ${collapsed ? "u-justify-content-center" : ""} u-mb-1`}
      >
        {!collapsed && item.label}
        {!collapsed && hasChildren && (
          <Icon
            name={isExpanded ? "CaretDown" : "CaretRight"}
            size={16}
            className="u-text-muted"
          />
        )}
        {!collapsed && item.badge && (
          <Badge
            variant={item.badge.variant}
            size="sm"
            label={item.badge.text}
          />
        )}
      </SideMenuItem>
    );

    if (hasChildren) {
      return (
        <div key={item.id}>
          {collapsed && item.tooltip ? (
            <Tooltip content={item.tooltip}>
              {menuItemContent}
            </Tooltip>
          ) : (
            menuItemContent
          )}

          {!collapsed && isExpanded && (
            <SideMenuList className="u-ps-4 u-mt-1">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </SideMenuList>
          )}
        </div>
      );
    }

    return (
      <div key={item.id}>
        {collapsed && item.tooltip ? (
          <Tooltip content={item.tooltip}>
            {menuItemContent}
          </Tooltip>
        ) : (
          menuItemContent
        )}
      </div>
    );
  };

  return (
    <div
      className={`u-h-100 u-bg-surface u-border-right u-d-flex u-flex-column u-transition-all u-shadow-sm ${
        collapsed ? "u-w-16" : "u-w-64"
      } ${className}`}
      data-testid={testId}
      style={{ height: '100vh' }}
    >
      {/* Header */}
      <div className="u-p-4 u-border-bottom">
        <div className="u-d-flex u-align-items-center u-justify-content-between">
          {!collapsed && (
            <div className="u-d-flex u-align-items-center u-gap-2">
              <Icon name="Globe" size={24} className="u-text-primary" />
              <span className="u-fw-bold u-text-lg u-text-primary">BCN ISP</span>
            </div>
          )}
          {collapsed && (
            <div className="u-d-flex u-justify-content-center u-w-100">
              <Icon name="Globe" size={24} className="u-text-primary" />
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              aria-label="Collapse sidebar"
            >
              <Icon name="CaretLeft" size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className={`u-p-4 u-border-bottom ${collapsed ? 'u-text-center' : ''}`}>
          {collapsed ? (
            <Tooltip content={`${user.name} (${user.role || 'User'})`}>
              <Avatar
                src={user.avatar}
                alt={user.name}
                size="sm"
                initials={user.name?.charAt(0)?.toUpperCase() || '?'}
                className="u-mx-auto u-cursor-pointer"
              />
            </Tooltip>
          ) : (
            <div className="u-d-flex u-align-items-center u-gap-3 u-cursor-pointer u-p-2 u-rounded u-hover-bg-light u-w-100 u-justify-content-start">
              <Avatar
                src={user.avatar}
                alt={user.name}
                size="sm"
                initials={user.name?.charAt(0)?.toUpperCase() || '?'}
              />
              <div className="u-flex-1 u-min-w-0">
                <div className="u-fw-medium u-text-sm u-truncate">
                  {user.name}
                </div>
                {user.role && (
                  <div className="u-text-xs u-text-secondary-emphasis u-truncate">
                    {user.role}
                  </div>
                )}
              </div>
              <Icon name="CaretDown" size={12} className="u-text-muted" />
            </div>
          )}
        </div>
      )}

      {/* Navigation Menu */}
      <div className="u-flex-1 u-overflow-y-auto u-py-2">
        <SideMenu>
          <SideMenuList>
            {menuItems.map((item, index) => {
              const showDivider = index > 0 && 
                item.category !== menuItems[index - 1].category &&
                !collapsed;
              
              return (
                <React.Fragment key={item.id}>
                  {showDivider && (
                    <div className="u-my-2 u-border-top u-border-light" />
                  )}
                  {renderMenuItem(item)}
                </React.Fragment>
              );
            })}
          </SideMenuList>
        </SideMenu>
      </div>

      {/* Footer */}
      <div className="u-p-4 u-border-top u-mt-auto">
        {!collapsed ? (
          <div className="u-d-flex u-flex-column u-gap-2">
            <div className="u-d-flex u-align-items-center u-gap-2 u-text-xs u-text-secondary-emphasis">
              <Icon name="Info" size={14} />
              <span>BCN ISP v1.0.0</span>
            </div>
            <div className="u-d-flex u-align-items-center u-gap-2 u-text-xs u-text-secondary-emphasis">
              <Icon name="Globe" size={12} />
              <span>System Online</span>
            </div>
          </div>
        ) : (
          <div className="u-d-flex u-justify-content-center">
            <Tooltip content="BCN ISP v1.0.0 - System Online">
              <Icon name="Info" size={16} className="u-text-secondary-emphasis" />
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
