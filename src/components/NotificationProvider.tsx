import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationToast } from './ui/notification-toast';

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Component that provides notification functionality
// Must be used within a Router context
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { 
    newNotification, 
    markAsRead, 
    clearNewNotification 
  } = useNotifications();

  // Handle navigation
  const handleNavigate = (link: string) => {
    navigate(link);
  };

  return (
    <>
      {children}
      <NotificationToast 
        notification={newNotification} 
        onClose={clearNewNotification}
        onRead={markAsRead}
        onNavigate={handleNavigate}
      />
    </>
  );
}; 