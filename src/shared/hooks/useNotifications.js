import { useEffect, useState, useCallback } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '@/shared/lib/firebase';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setIsPermissionGranted(true);
        toast.success('Notifications enabled!');
        
        // You can send this token to your backend to store it
        // await saveTokenToBackend(token);
        
        return token;
      } else {
        toast.error('Please enable notifications to receive updates');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up foreground message listener
  useEffect(() => {
    if (!isPermissionGranted) return;

    const unsubscribe = onForegroundMessage((payload) => {
      // Show toast for foreground messages
      if (payload.notification) {
        toast(payload.notification.title, {
          description: payload.notification.body,
          duration: 5000,
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isPermissionGranted]);

  // Check initial permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  return {
    fcmToken,
    isPermissionGranted,
    isLoading,
    requestPermission
  };
};

export default useNotifications;
