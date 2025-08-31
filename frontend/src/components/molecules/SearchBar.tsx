import React, { useState } from "react";
import { Input, Button, Icon } from "@shohojdhara/atomix";

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * SearchBar Molecule
 *
 * A search input combined with search and clear buttons.
 * Built using Atomix Input, Button, and Icon atoms.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  value: controlledValue,
  onSearch,
  onClear,
  disabled = false,
  loading = false,
  size = "md",
  fullWidth = false,
  className = "",
  "data-testid": testId,
}) => {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = controlledValue !== undefined;
  const searchValue = isControlled ? controlledValue : internalValue;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    // If user types and presses Enter, trigger search
    if (e.key === 'Enter' && onSearch && newValue.trim()) {
      onSearch(newValue.trim());
    }
  };

  const handleSearch = () => {
    if (onSearch && searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("");
    }
    if (onClear) {
      onClear();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div
      className={`u-d-flex u-align-items-center u-gap-2 ${fullWidth ? "u-width-100" : ""} ${className}`}
      data-testid={testId}
    >
      <div className={`u-position-relative ${fullWidth ? "u-flex-1" : ""}`}>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          size={size}
          className="u-pr-10"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="u-position-absolute u-right-2 u-top-50 u-transform-translate-y-50 u-bg-transparent u-border-0 u-cursor-pointer u-p-1 u-text-muted hover:u-text-dark"
            aria-label="Clear search"
          >
            <Icon name="XCircle" size={16} />
          </button>
        )}
      </div>

      <Button
        onClick={handleSearch}
        disabled={disabled || loading || !searchValue.trim()}
        size={size}
        variant="primary"
        aria-label="Search"
        className="u-d-flex u-align-items-center u-gap-1"
      >
        {loading ? (
          <Icon name="Spinner" size={16} className="u-animation-spin" />
        ) : (
          <Icon name="MagnifyingGlass" size={16} />
        )}
        <span className="u-d-none u-d-sm-inline">Search</span>
      </Button>
    </div>
  );
};

export default SearchBar;