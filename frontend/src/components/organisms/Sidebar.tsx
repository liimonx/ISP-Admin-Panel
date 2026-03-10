import React, { useState, useEffect } from "react";
import {
  SideMenu,
  SideMenuList,
  SideMenuItem,
  Icon,
  Badge,
  IconProps,
  Tooltip,
} from "@shohojdhara/atomix";
import { useLocation, useNavigate } from "react-router-dom";
import { useSidebarBadges } from "../../hooks/useSidebarBadges";

export interface SidebarProps {
  collapsed?: boolean;
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

// Function to create menu items with dynamic badges
const createMenuItems = (badgeData: any): MenuItem[] => [
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
      text: badgeData?.customers?.total?.toString() || "0",
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
        badge: {
          text: badgeData?.subscriptions?.active?.toString() || "0",
          variant:
            badgeData?.subscriptions?.pending > 0 ? "warning" : "success",
        },
        tooltip: "Active subscriptions",
      },
      {
        id: "router-management",
        label: "Router Management",
        icon: "Broadcast",
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
          text: badgeData?.monitoring?.alerts?.toString() || "0",
          variant: badgeData?.monitoring?.alerts > 0 ? "error" : "secondary",
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
        icon: "Broadcast",
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
  className = "",
  "data-testid": testId,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { badgeData, isLoading, hasError } = useSidebarBadges();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "services",
    "network",
  ]);

  // Create menu items with dynamic badge data
  const menuItems = createMenuItems(badgeData);

  // Auto-expand sections based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpandedSections: string[] = [];

    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.path === currentPath,
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
        className={`${level > 0 ? "u-ps-8" : ""} ${collapsed ? "u-justify-center" : ""} u-mb-1`}
      >
        {!collapsed && item.label}
        {!collapsed && hasChildren && (
          <Icon
            name={isExpanded ? "CaretDown" : "CaretRight"}
            size={"sm"}
            className="u-text-secondary"
          />
        )}
        {!collapsed && item.badge && (
          <Badge
            variant={hasError ? "error" : item.badge.variant}
            size="sm"
            label={isLoading ? "..." : hasError ? "!" : item.badge.text}
          />
        )}
      </SideMenuItem>
    );

    if (hasChildren) {
      return (
        <div key={item.id}>
          {collapsed && item.tooltip ? (
            <Tooltip content={item.tooltip}>{menuItemContent}</Tooltip>
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
          <Tooltip content={item.tooltip}>{menuItemContent}</Tooltip>
        ) : (
          menuItemContent
        )}
      </div>
    );
  };

  return (
    <div data-testid={testId}>
      {/* Navigation Menu */}
      <SideMenu
        glass={{
          elasticity: 0,
          blurAmount: 1,
          displacementScale: 100,
          className: `  ${collapsed ? "u-w-16" : "u-w-64"} ${className}`,
          style: {
            position: "fixed",
            top: "90px",
            bottom: "0",
            height: "100%",
          },
        }}
      >
        <SideMenuList>
          {menuItems.map((item) => {
            return (
              <React.Fragment key={item.id}>
                {renderMenuItem(item)}
              </React.Fragment>
            );
          })}
        </SideMenuList>

        <div className="u-p-4 u-border">
          {!collapsed ? (
            <div className="u-flex u-flex-column u-gap-2">
              <div className="u-flex u-items-center u-gap-2 u-fs-xs u-text-secondary-emphasis">
                <Icon name="Info" size={14} />
                <span>BCN ISP v1.0.0</span>
              </div>
              <div className="u-flex u-items-center u-gap-2 u-fs-xs u-text-secondary-emphasis">
                <Icon name="Globe" size={12} />
                <span>System Online</span>
              </div>
            </div>
          ) : (
            <div className="u-flex u-justify-center">
              <Tooltip content="BCN ISP v1.0.0 - System Online">
                <Icon
                  name="Info"
                  size={"sm"}
                  className="u-text-secondary-emphasis"
                />
              </Tooltip>
            </div>
          )}
        </div>
      </SideMenu>
    </div>
  );
};

export default Sidebar;
