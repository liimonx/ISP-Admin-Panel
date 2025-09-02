import React from 'react';
import { Button, Icon } from '@shohojdhara/atomix';

interface LoadingButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  className = '',
  ...props
}) => {
  const iconSize = size === 'lg' ? 20 : size === 'sm' ? 14 : 16;
  
  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading && (
        <Icon 
          name="Spinner" 
          size={iconSize} 
          className={`u-spin u-me-2`} 
        />
      )}
      {isLoading ? (loadingText || 'Loading...') : children}
    </Button>
  );
};