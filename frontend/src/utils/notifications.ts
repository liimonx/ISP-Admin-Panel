import { AppError, ErrorUtils } from './errorHandler';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationOptions {
  title?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  autoClose?: boolean;
}

type NotificationCallback = (notification: Notification) => void;

class NotificationManager {
  private listeners: NotificationCallback[] = [];
  private notifications: Map<string, Notification> = new Map();
  private idCounter = 0;

  private generateId(): string {
    return `notification_${Date.now()}_${++this.idCounter}`;
  }

  subscribe(callback: NotificationCallback): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(notification: Notification): void {
    this.notifications.set(notification.id, notification);
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });

    // Auto-dismiss non-persistent notifications
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }

  success(message: string, options: NotificationOptions = {}): string {
    const notification: Notification = {
      id: this.generateId(),
      type: 'success',
      title: options.title || 'Success',
      message,
      duration: options.duration || 4000,
      persistent: options.persistent || false,
      actions: options.actions,
      timestamp: new Date(),
    };

    this.notify(notification);
    return notification.id;
  }

  error(message: string, options: NotificationOptions = {}): string {
    const notification: Notification = {
      id: this.generateId(),
      type: 'error',
      title: options.title || 'Error',
      message,
      duration: options.duration || 6000,
      persistent: options.persistent || false,
      actions: options.actions,
      timestamp: new Date(),
    };

    this.notify(notification);
    return notification.id;
  }

  warning(message: string, options: NotificationOptions = {}): string {
    const notification: Notification = {
      id: this.generateId(),
      type: 'warning',
      title: options.title || 'Warning',
      message,
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      actions: options.actions,
      timestamp: new Date(),
    };

    this.notify(notification);
    return notification.id;
  }

  info(message: string, options: NotificationOptions = {}): string {
    const notification: Notification = {
      id: this.generateId(),
      type: 'info',
      title: options.title || 'Information',
      message,
      duration: options.duration || 4000,
      persistent: options.persistent || false,
      actions: options.actions,
      timestamp: new Date(),
    };

    this.notify(notification);
    return notification.id;
  }

  dismiss(id: string): void {
    if (this.notifications.has(id)) {
      this.notifications.delete(id);
      this.listeners.forEach(callback => {
        try {
          callback({
            id,
            type: 'info',
            title: '',
            message: '',
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Error in notification dismiss callback:', error);
        }
      });
    }
  }

  dismissAll(): void {
    const ids = Array.from(this.notifications.keys());
    ids.forEach(id => this.dismiss(id));
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  getById(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  // Enhanced methods for API responses
  apiSuccess(operation: string, resourceName?: string, options: NotificationOptions = {}): string {
    const message = resourceName
      ? `${resourceName} ${operation} successfully`
      : `${operation} completed successfully`;

    return this.success(message, {
      title: 'Operation Successful',
      ...options,
    });
  }

  apiError(error: AppError, operation?: string, options: NotificationOptions = {}): string {
    let title = 'Operation Failed';
    let message = ErrorUtils.getUserFriendlyMessage(error);

    // Customize message based on error type
    if (ErrorUtils.isNetworkError(error)) {
      title = 'Connection Error';
      message = 'Please check your internet connection and try again.';
    } else if (ErrorUtils.isAuthError(error)) {
      title = 'Authentication Error';
      message = 'Please log in again to continue.';
    } else if (ErrorUtils.isValidationError(error)) {
      title = 'Validation Error';
    } else if (ErrorUtils.isRateLimitError(error)) {
      title = 'Rate Limited';
      message = 'You\'re making requests too quickly. Please wait a moment.';
    } else if (ErrorUtils.isServerError(error)) {
      title = 'Server Error';
      message = 'Something went wrong on our end. Please try again later.';
    }

    if (operation) {
      title = `${operation} Failed`;
    }

    // Add retry action for retryable errors
    const actions: NotificationAction[] = [];
    if (options.actions) {
      actions.push(...options.actions);
    }

    return this.error(message, {
      title,
      persistent: ErrorUtils.isServerError(error) || ErrorUtils.isNetworkError(error),
      actions,
      ...options,
    });
  }

  // Bulk operation notifications
  bulkOperationStart(operation: string, count: number): string {
    return this.info(`Starting ${operation} for ${count} items...`, {
      title: 'Bulk Operation',
      persistent: true,
    });
  }

  bulkOperationProgress(operation: string, completed: number, total: number, id?: string): string {
    const message = `${operation}: ${completed}/${total} completed`;

    if (id) {
      // Update existing notification
      const existing = this.getById(id);
      if (existing) {
        existing.message = message;
        this.notify(existing);
        return id;
      }
    }

    return this.info(message, {
      title: 'Bulk Operation Progress',
      persistent: true,
    });
  }

  bulkOperationComplete(operation: string, successful: number, failed: number, originalId?: string): string {
    if (originalId) {
      this.dismiss(originalId);
    }

    if (failed === 0) {
      return this.success(`${operation} completed successfully for all ${successful} items.`, {
        title: 'Bulk Operation Complete',
      });
    } else if (successful === 0) {
      return this.error(`${operation} failed for all ${failed} items.`, {
        title: 'Bulk Operation Failed',
      });
    } else {
      return this.warning(`${operation} completed with mixed results: ${successful} successful, ${failed} failed.`, {
        title: 'Bulk Operation Complete',
      });
    }
  }

  // Rate limit specific notifications
  rateLimitWarning(endpoint: string, retryAfter: number): string {
    const minutes = Math.ceil(retryAfter / 60000);
    return this.warning(
      `Rate limit reached for ${endpoint}. Please wait ${minutes} minute(s) before trying again.`,
      {
        title: 'Rate Limit Exceeded',
        duration: retryAfter,
        persistent: true,
      }
    );
  }

  // Token expiry notifications
  tokenExpiryWarning(minutesUntilExpiry: number): string {
    return this.warning(
      `Your session will expire in ${minutesUntilExpiry} minutes. Please save your work.`,
      {
        title: 'Session Expiring',
        persistent: true,
        actions: [
          {
            label: 'Extend Session',
            action: () => {
              // This would trigger a token refresh
              window.dispatchEvent(new CustomEvent('extendSession'));
            },
            style: 'primary',
          },
        ],
      }
    );
  }

  // Connection status notifications
  connectionLost(): string {
    return this.error(
      'Connection to the server has been lost. Retrying automatically...',
      {
        title: 'Connection Lost',
        persistent: true,
      }
    );
  }

  connectionRestored(): string {
    return this.success('Connection to the server has been restored.', {
      title: 'Connection Restored',
    });
  }

  // Maintenance notifications
  maintenanceMode(): string {
    return this.warning(
      'The system is currently under maintenance. Some features may be unavailable.',
      {
        title: 'Maintenance Mode',
        persistent: true,
      }
    );
  }

  // Data synchronization notifications
  syncStart(): string {
    return this.info('Synchronizing data...', {
      title: 'Sync in Progress',
      persistent: true,
    });
  }

  syncComplete(): string {
    return this.success('Data synchronized successfully.', {
      title: 'Sync Complete',
    });
  }

  syncError(error: AppError): string {
    return this.error(
      'Failed to synchronize data. Some information may be outdated.',
      {
        title: 'Sync Error',
        actions: [
          {
            label: 'Retry',
            action: () => {
              window.dispatchEvent(new CustomEvent('retrySync'));
            },
            style: 'primary',
          },
        ],
      }
    );
  }
}

// Create singleton instance
export const notificationManager = new NotificationManager();

// Convenience exports
export const {
  success,
  error,
  warning,
  info,
  apiSuccess,
  apiError,
  dismiss,
  dismissAll,
  subscribe,
} = notificationManager;

// React hook for using notifications
export const useNotifications = () => {
  return {
    success: notificationManager.success.bind(notificationManager),
    error: notificationManager.error.bind(notificationManager),
    warning: notificationManager.warning.bind(notificationManager),
    info: notificationManager.info.bind(notificationManager),
    apiSuccess: notificationManager.apiSuccess.bind(notificationManager),
    apiError: notificationManager.apiError.bind(notificationManager),
    dismiss: notificationManager.dismiss.bind(notificationManager),
    dismissAll: notificationManager.dismissAll.bind(notificationManager),
    bulkOperationStart: notificationManager.bulkOperationStart.bind(notificationManager),
    bulkOperationProgress: notificationManager.bulkOperationProgress.bind(notificationManager),
    bulkOperationComplete: notificationManager.bulkOperationComplete.bind(notificationManager),
    rateLimitWarning: notificationManager.rateLimitWarning.bind(notificationManager),
    tokenExpiryWarning: notificationManager.tokenExpiryWarning.bind(notificationManager),
    connectionLost: notificationManager.connectionLost.bind(notificationManager),
    connectionRestored: notificationManager.connectionRestored.bind(notificationManager),
    subscribe: notificationManager.subscribe.bind(notificationManager),
  };
};

export default notificationManager;
