import React, { useState } from "react";
import {
  Navbar,
  Button,
  Icon,
  ColorModeToggle,
  Badge,
  Nav,
  NavItem,
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

  return (
    <Navbar
      data-testid={testId}
      position="fixed"
      containerWidth="100%"
      glass
      className="u-shadow-sm"
    >
      <Nav className="u-items-center u-gap-2">
        {showSidebarToggle && (
          <NavItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
              iconName="List"
              iconSize={20}
            />
          </NavItem>
        )}

        <NavItem className="u-flex u-items-center u-gap-2 u-ms-2">
          <div className="u-bg-primary-subtle u-p-1 u-rounded-sm u-flex u-items-center u-justify-center">
            <Icon name="Globe" size={24} className="u-text-primary" />
          </div>
          <span className="u-sm-lg u-font-bold u-text-primary u-none u-display-sm-block">
            BCN ISP
          </span>
        </NavItem>
      </Nav>

      <Nav alignment="end" className="u-items-center u-gap-3">
        {showSearch && (
          <div className="u-none u-display-md-flex u-flex-1 u-max-w-md u-mx-4">
            <SearchBar
              value={searchValue}
              onSearch={(value) => {
                setSearchValue(value);
                handleSearch(value);
              }}
              onClear={handleSearchClear}
              placeholder="Search customers, plans, invoices..."
              fullWidth
              size="sm"
            />
          </div>
        )}

        {showSearch && (
          <Button
            variant="ghost"
            size="sm"
            aria-label="Search"
            className="u-display-md-none"
            iconName="MagnifyingGlass"
            iconSize={20}
          />
        )}

        {showNotifications && (
          <div className="u-relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNotificationClick}
              aria-label="Notifications"
              iconName="Bell"
              iconSize={20}
            />
            {notifications > 0 && (
              <Badge
                variant="error"
                size="sm"
                label={notifications.toString()}
                className="u-absolute u-top-0 u-end-0 u-transform u-translate-x-25 u-translate-y--25 u-z-1"
              />
            )}
          </div>
        )}

        <div className="u-border-start u-border-light u-h-50 u-mx-1 u-none u-display-sm-block" />

        <ColorModeToggle defaultValue="dark" />

        {showUserMenu && user && (
          <div className="u-ms-2">
            <UserAvatar
              user={{
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                status: user.status,
              }}
              showDropdown
              size="md"
            />
          </div>
        )}
      </Nav>
    </Navbar>
  );
};

export default Header;
