import React from 'react';
import { Spinner } from '@shohojdhara/atomix';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  return (
    <Spinner 
      size={size} 
      variant={variant} 
      className={className}
    />
  );
};

import { Card } from '@shohojdhara/atomix';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  children,
}) => {
  return (
    <div className="u-position-relative">
      {children}
      {isLoading && (
        <div className="u-position-absolute u-top-0 u-start-0 u-w-100 u-h-100 u-flex u-items-center u-justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}>
          <Card className="u-p-6 u-flex u-flex-column u-items-center u-gap-4">
            <LoadingSpinner size="lg" />
            <p className="u-text-sm u-text-center">{message}</p>
          </Card>
        </div>
      )}
    </div>
  );
};