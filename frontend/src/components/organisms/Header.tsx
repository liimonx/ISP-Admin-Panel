import React, { useState } from "react";
import {
  Navbar,
  Button,
  Icon,
  ColorModeToggle,
  Badge,
} from "@shohojdhara/atomix";
import { UserAvatar } from "../molecules/UserAvatar";
import { SearchBar } from "../molecules/SearchBar";

export interface HeaderProps {
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
    status?: "online" | "offline" | "away" | "busy";
  };
  notifications?: number;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onMenuToggle?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showSidebarToggle?: boolean;
  sidebarCollapsed?: boolean;
  className?: string;
  "data-testid"?: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications = 0,
  onSearch,
  onNotificationClick,
  onMenuToggle,
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  showSidebarToggle = true,
  sidebarCollapsed = false,
  className = "",
  "data-testid": testId,
}) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
  };

  const userDropdownItems = [
    {
      label: "Profile",
      icon: "User",
      onClick: () => console.log("Profile clicked"),
    },
    {
      label: "Settings",
      icon: "Gear",
      onClick: () => console.log("Settings clicked"),
    },
    {
      label: "Sign out",
      icon: "SignOut",
      onClick: () => console.log("Sign out clicked"),
      divider: true,
    },
  ];

  return (
    <Navbar
      className={`u-bg-surface u-border-b u-shadow-sm ${className}`}
      data-testid={testId}
      position="fixed"
      containerWidth="100%"
    >
      <div className="u-flex u-items-center u-justify-between u-w-100 u-px-4 u-py-3">
        <div className="u-flex u-items-center u-gap-4">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="md"
              glass
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
            >
              <Icon name="List" size={20} />
            </Button>
          )}

          <div className="u-flex u-items-center u-gap-2">
            <Icon name="Globe" size={24} className="u-text-primary" />
            <span className="u-text-lg u-fw-bold u-text-primary">BCN ISP</span>
          </div>
        </div>

        {showSearch && (
          <div className="u-none u-md-flex u-flex-1 u-max-w-lg u-mx-6">
            <SearchBar
              value={searchValue}
              onSearch={(value) => {
                setSearchValue(value);
                handleSearch(value);
              }}
              onClear={handleSearchClear}
              placeholder="Search customers, plans, invoices..."
              fullWidth
            />
          </div>
        )}

        <div className="u-flex u-items-center u-gap-3">
          {showSearch && (
            <Button
              variant="ghost"
              size="md"
              aria-label="Search"
              className="u-md-none"
            >
              <Icon name="MagnifyingGlass" size={20} />
            </Button>
          )}

          {showNotifications && (
            <Button
              variant="ghost"
              size="md"
              onClick={onNotificationClick}
              aria-label="Notifications"
              className="u-relative"
            >
              <Icon name="Bell" size={20} />
              {notifications > 0 && (
                <Badge
                  variant="error"
                  size="sm"
                  label={notifications.toString()}
                  className="u-absolute u-top-0 u-end-0 u-transform u-translate-x--50 u-translate-y--50"
                />
              )}
            </Button>
          )}

          <ColorModeToggle />

          {showUserMenu && user && (
            <UserAvatar
              user={{
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                status: user.status,
              }}
              showDropdown
              dropdownItems={userDropdownItems}
              size="md"
            />
          )}
        </div>
      </div>
    </Navbar>
  );
};

export default Header;
