import React, { useState } from "react";
import { Input, Button } from "@shohojdhara/atomix";

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
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div
      className={`u-flex u-items-center u-gap-2 ${fullWidth ? "u-w-100" : ""} ${className}`}
      data-testid={testId}
    >
      <div
        className={`u-relative ${fullWidth ? "u-flex-1" : ""}`}
        onKeyDown={handleKeyDown}
      >
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          disabled={disabled}
          className="u-pe-10" // Add padding-end for the clear button
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="u-absolute u-top-50 u-end-2 u-transform u-translate-y--50 u-p-1 u-h-auto"
            aria-label="Clear search"
            iconName="XCircle"
            iconSize={16}
          />
        )}
      </div>

      <Button
        onClick={handleSearch}
        disabled={disabled || loading || !searchValue.trim()}
        aria-label="Search"
        variant="primary"
        size={size}
        iconName={loading ? "Spinner" : "MagnifyingGlass"}
        className={loading ? "u-animation-spin" : ""}
      >
        <span className="u-none u-lg-inline u-ms-1">Search</span>
      </Button>
    </div>
  );
};

export default SearchBar;
