import React, { useState } from "react";
import {
  SideMenu,
  SideMenuList,
  SideMenuItem,
  Icon,
  Badge,
  Button,
  Avatar,
  IconProps,
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
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "ChartBar",
    path: "/",
  },
  {
    id: "customers",
    label: "Customers",
    icon: "Users",
    path: "/customers",
    badge: {
      text: "245",
      variant: "primary",
    },
  },
  {
    id: "services",
    label: "Services",
    icon: "Globe",
    children: [
      {
        id: "plans",
        label: "Internet Plans",
        icon: "Lightning",
        path: "/plans",
      },
      {
        id: "subscriptions",
        label: "Subscriptions",
        icon: "CreditCard",
        path: "/subscriptions",
      },
    ],
  },
  {
    id: "network",
    label: "Network",
    icon: "Share",
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
      },
      {
        id: "devices",
        label: "Network Devices",
        icon: "DeviceMobile",
        path: "/network",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: "Receipt",
    path: "/billing",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "ChartPie",
    children: [
      {
        id: "usage",
        label: "Usage Reports",
        icon: "ChartLine",
        path: "/reports/usage",
      },
      {
        id: "revenue",
        label: "Revenue Reports",
        icon: "CurrencyDollar",
        path: "/reports/revenue",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Gear",
    children: [
      {
        id: "users",
        label: "User Management",
        icon: "PersonPlus",
        path: "/users",
      },
      {
        id: "system",
        label: "System Settings",
        icon: "Wrench",
        path: "/settings/system",
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

    if (hasChildren) {
      return (
        <div key={item.id} className="u-mb-1">
          <SideMenuItem
            icon={<Icon name={item.icon as any} size={20} />}
            active={active}
            onClick={() => handleMenuClick(item)}
            className={`${level > 0 ? "u-pl-8" : ""} ${collapsed ? "u-justify-content-center" : ""}`}
          >
            {!collapsed && item.label}
            {!collapsed && (
              <Icon
                name={isExpanded ? "CaretDown" : "CaretRight"}
                size={16}
                className="u-text-muted"
              />
            )}
          </SideMenuItem>

          {!collapsed && isExpanded && (
            <SideMenuList className="u-pl-4 u-mt-1">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </SideMenuList>
          )}
        </div>
      );
    }

    return (
      <SideMenuItem
        key={item.id}
        icon={<Icon name={item.icon as any} size={20} />}
        active={active}
        onClick={() => handleMenuClick(item)}
        className={`${level > 0 ? "u-pl-8" : ""} ${collapsed ? "u-justify-content-center" : ""} u-mb-1`}
      >
        {!collapsed && item.label}
        {!collapsed && item.badge && (
          <Badge
            variant={item.badge.variant}
            size="sm"
            label={item.badge.text}
          />
        )}
      </SideMenuItem>
    );
  };

  return (
    <div
      className={`u-h-100 u-bg-surface u-border-right u-d-flex u-flex-column u-transition-all u-shadow-sm ${
        collapsed ? "u-width-16" : "u-width-64"
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
              <span className="u-font-weight-bold u-text-lg u-text-primary">BCN ISP</span>
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
            <Avatar
              src={user.avatar}
              alt={user.name}
              size="sm"
              initials={user.name?.charAt(0)?.toUpperCase() || '?'}
              className="u-mx-auto"
            />
          ) : (
            <div className="u-d-flex u-align-items-center u-gap-3">
              <Avatar
                src={user.avatar}
                alt={user.name}
                size="sm"
                initials={user.name?.charAt(0)?.toUpperCase() || '?'}
              />
              <div className="u-flex-1 u-min-width-0">
                <div className="u-font-weight-medium u-text-sm u-truncate">
                  {user.name}
                </div>
                {user.role && (
                  <div className="u-text-xs u-text-secondary u-truncate">
                    {user.role}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Menu */}
      <div className="u-flex-1 u-overflow-y-auto u-py-2">
        <SideMenu >
          <SideMenuList>
            {menuItems.map((item) => renderMenuItem(item))}
          </SideMenuList>
        </SideMenu>
      </div>

      {/* Footer */}
      <div className="u-p-4 u-border-top u-mt-auto">
        {!collapsed ? (
          <div className="u-d-flex u-align-items-center u-gap-2 u-text-xs u-text-secondary">
            <Icon name="Info" size={14} />
            <span>BCN ISP v1.0.0</span>
          </div>
        ) : (
          <div className="u-d-flex u-justify-content-center">
            <Icon name="Info" size={16} className="u-text-secondary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
