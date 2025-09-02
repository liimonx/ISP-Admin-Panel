import React, { useState, useEffect } from 'react';
import { Callout, Button } from '@shohojdhara/atomix';
import { Notification, notificationManager } from '@/utils/notifications';

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div
      className={`
        u-transition-all
        ${isVisible && !isExiting ? 'u-opacity-100' : 'u-opacity-0'}
        u-w-100 u-mb-3
      `}
      style={{ maxWidth: '24rem' }}
    >
      <Callout
        variant={notification.type}
        title={notification.title}
        className="u-shadow-lg u-position-relative"
      >
        <p className="u-mb-0">{notification.message}</p>
        {notification.actions && notification.actions.length > 0 && (
          <div className="u-d-flex u-gap-2 u-mt-3">
            {notification.actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.style === 'primary' ? 'primary' : action.style === 'danger' ? 'error' : 'secondary'}
                onClick={action.action}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        <button
          onClick={handleDismiss}
          className="u-position-absolute u-top-0 u-end-0 u-p-2 u-bg-transparent u-border-0 u-text-muted"
          style={{ transform: 'translate(25%, -25%)' }}
        >
          ×
        </button>
      </Callout>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notification) => {
      setNotifications(prev => {
        const existing = prev.find(n => n.id === notification.id);
        if (existing) {
          return prev.map(n => n.id === notification.id ? notification : n);
        }
        return [...prev, notification];
      });
    });

    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    notificationManager.dismiss(id);
  };

  return (
    <div className="u-position-fixed u-top-0 u-end-0 u-p-4" style={{ zIndex: 1050 }}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};