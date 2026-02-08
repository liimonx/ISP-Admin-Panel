import React, { useEffect } from "react";
import { Icon } from "@shohojdhara/atomix";

export interface ToastProps {
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  onClose?: () => void;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Toast Component
 *
 * A simple toast notification component for displaying temporary messages.
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  variant = "info",
  onClose,
  duration = 5000,
  className = "",
  style = {},
}) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          backgroundColor: "#d1edff",
          borderColor: "#0ea5e9",
          color: "#0c4a6e",
          icon: "CheckCircle",
        };
      case "error":
        return {
          backgroundColor: "#fee2e2",
          borderColor: "#ef4444",
          color: "#7f1d1d",
          icon: "XCircle",
        };
      case "warning":
        return {
          backgroundColor: "#fef3c7",
          borderColor: "#f59e0b",
          color: "#78350f",
          icon: "Warning",
        };
      default:
        return {
          backgroundColor: "#e0f2fe",
          borderColor: "#06b6d4",
          color: "#164e63",
          icon: "Info",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className={`u-d-flex u-align-items-center u-gap-3 u-p-3 u-border u-rounded u-shadow-sm ${className}`}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        borderColor: variantStyles.borderColor,
        color: variantStyles.color,
        minWidth: "300px",
        maxWidth: "500px",
        ...style,
      }}
      role="alert"
      aria-live="polite"
    >
      <Icon
        name={variantStyles.icon as any}
        size={20}
        style={{ color: variantStyles.borderColor }}
      />
      <div className="u-flex-grow-1">
        <p className="u-mb-0 u-fw-medium">{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          className="u-btn u-btn-sm u-btn-ghost u-p-1"
          onClick={onClose}
          aria-label="Close notification"
          style={{ color: variantStyles.color }}
        >
          <Icon name="X" size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
