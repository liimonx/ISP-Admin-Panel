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
import { GlobalSearchResult, Notification } from "@/services/api";

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
  searchResults?: GlobalSearchResult[];
  isSearching?: boolean;
  notificationsList?: Notification[];
  isNotificationsOpen?: boolean;
  onMarkNotificationRead?: (id: number) => void;
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
  className = "",
  "data-testid": testId,
  searchResults = [],
  isSearching = false,
  notificationsList = [],
  isNotificationsOpen = false,
  onMarkNotificationRead,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);

  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
      setShowResults(true);
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
    setShowResults(false);
  };

  return (
    <Navbar
      data-testid={testId}
      position="fixed"
      containerWidth="100%"
      glass={{ withBorder: false }}
      className={`u-shadow-sm ${className}`.trim()}
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
            <Icon name="Globe" size={"lg"} className="u-text-primary" />
          </div>
          <span className="u-sm-lg u-font-bold u-text-primary u-none u-display-sm-block">
            BCN ISP
          </span>
        </NavItem>
      </Nav>

      <Nav alignment="end" className="u-items-center u-gap-3">
        {showSearch && (
          <div className="u-none u-display-md-flex u-flex-1 u-max-w-md u-mx-4 u-relative">
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
            {showResults && searchValue && (
              <div className="u-absolute u-top-100 u-start-0 u-w-100 u-mt-1 u-bg-dark u-border u-border-light u-rounded u-shadow-lg u-z-modal u-overflow-hidden">
                {isSearching ? (
                  <div className="u-p-3 u-text-center u-text-secondary-emphasis u-fs-sm">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="u-max-h-50 u-overflow-y-auto">
                    {searchResults.map((result) => (
                      <a
                        key={result.id}
                        href={result.url}
                        className="u-block u-p-3 u-border-b u-border-light u-text-decoration-none u-hover-bg-primary-subtle u-transition"
                      >
                        <div className="u-flex u-items-center u-justify-between">
                          <span className="u-font-bold u-text-primary u-fs-sm">
                            {result.title}
                          </span>
                          <Badge size="sm" variant="info" label={result.type} />
                        </div>
                        {result.subtitle && (
                          <div className="u-text-secondary-emphasis u-fs-xs u-mt-1">
                            {result.subtitle}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="u-p-3 u-text-center u-text-secondary-emphasis u-fs-sm">
                    No results found
                  </div>
                )}
              </div>
            )}
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

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="u-absolute u-top-100 u-end-0 u-mt-2 u-w-300 u-bg-dark u-border u-border-light u-rounded u-shadow-lg u-z-modal u-overflow-hidden">
                <div className="u-p-3 u-border-b u-border-light u-flex u-items-center u-justify-between">
                  <span className="u-font-bold">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge
                      variant="primary"
                      size="sm"
                      label={`${unreadCount} new`}
                    />
                  )}
                </div>

                <div className="u-max-h-50 u-overflow-y-auto">
                  {notificationsList.length > 0 ? (
                    notificationsList.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.is_read && onMarkNotificationRead) {
                            onMarkNotificationRead(notif.id);
                          }
                        }}
                        className={`u-p-3 u-border-b u-border-light u-cursor-pointer u-transition u-hover-bg-primary-subtle ${
                          notif.is_read ? "u-opacity-50" : "u-bg-gray-subtle"
                        }`}
                      >
                        <div className="u-flex u-items-start u-gap-2">
                          <Icon
                            name={
                              notif.type === "error"
                                ? "WarningCircle"
                                : notif.type === "warning"
                                  ? "Warning"
                                  : notif.type === "success"
                                    ? "CheckCircle"
                                    : "Info"
                            }
                            size={16}
                            className={`u-mt-1 ${
                              notif.type === "error"
                                ? "u-text-error"
                                : notif.type === "warning"
                                  ? "u-text-warning"
                                  : notif.type === "success"
                                    ? "u-text-success"
                                    : "u-text-info"
                            }`}
                          />
                          <div>
                            <div
                              className={`u-fs-sm ${!notif.is_read ? "u-font-bold" : ""}`}
                            >
                              {notif.title}
                            </div>
                            <div className="u-fs-xs u-text-secondary-emphasis u-mt-1">
                              {notif.message}
                            </div>
                            <div className="u-fs-xs u-text-secondary-emphasis u-mt-1">
                              {new Date(notif.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="u-p-4 u-text-center u-text-secondary-emphasis">
                      No notifications available
                    </div>
                  )}
                </div>
              </div>
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
