import React, { useState } from "react";
import { Avatar, Badge, Icon, Dropdown } from "@shohojdhara/atomix";

export interface UserAvatarProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
    status?: "online" | "offline" | "away" | "busy";
  };
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  showDropdown?: boolean;
  dropdownItems?: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    divider?: boolean;
  }>;
  className?: string;
  "data-testid"?: string;
}

const statusVariants = {
  online: "success",
  offline: "secondary",
  away: "warning",
  busy: "error",
} as const;

const statusLabels = {
  online: "Online",
  offline: "Offline",
  away: "Away",
  busy: "Busy",
};

/**
 * UserAvatar Molecule
 *
 * A user avatar with optional status indicator and dropdown menu.
 * Built using Atomix Avatar, Dropdown, Badge, and Icon atoms.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  showStatus = true,
  showDropdown = false,
  dropdownItems = [],
  className = "",
  "data-testid": testId,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const defaultDropdownItems = [
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

  const items = dropdownItems.length > 0 ? dropdownItems : defaultDropdownItems;

  const avatarContent = (
    <div
      className={`u-position-relative u-d-inline-block ${className}`}
      data-testid={testId}
    >
      <Avatar
        src={user.avatar}
        alt={user.name}
        size={size}
        initials={user.name?.charAt(0)?.toUpperCase() || "?"}
      />

      {showStatus && user.status && (
        <div className="u-position-absolute u-bottom-0 u-right-0 u-transform-translate-25">
          <Badge 
            variant={statusVariants[user.status]} 
            size="sm" 
            label="" 
          />
        </div>
      )}
    </div>
  );

  if (showDropdown && items.length > 0) {
    return (
      <div className="u-position-relative">
        <button
          type="button"
          className="u-border-0 u-cursor-pointer u-p-0"
          aria-label={`${user.name} menu`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {avatarContent}
        </button>

        {isDropdownOpen && (
          <div className="u-position-absolute u-right-0 u-border u-border-radius-2 u-shadow-lg u-z-50 u-min-width-48">
            <div className="u-py-2">
              {/* User Info Header */}
              <div className="u-px-4 u-py-2 u-border-bottom">
                <div className="u-font-weight-medium u-text-sm">
                  {user.name}
                </div>
                {user.email && (
                  <div className="u-text-xs u-text-muted">{user.email}</div>
                )}
                {user.role && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    label={user.role}
                    className="u-mt-1"
                  />
                )}
              </div>

              {/* Menu Items */}
              <div className="u-py-1">
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    {item.divider && <div className="u-border-top u-my-1" />}
                    <button
                      type="button"
                      className="u-width-100 u-text-left u-px-4 u-py-2 u-bg-transparent u-border-0 u-cursor-pointer u-d-flex u-align-items-center u-gap-2 hover:u-bg-light"
                      onClick={() => {
                        item.onClick();
                        setIsDropdownOpen(false);
                      }}
                    >
                      {item.icon && <Icon name={item.icon as any} size={16} />}
                      <span className="u-text-sm">{item.label}</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return avatarContent;
};

export default UserAvatar;
