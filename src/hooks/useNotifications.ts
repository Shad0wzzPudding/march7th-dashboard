import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support push notifications.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll now receive reminders about your tasks and events."
        });
        return true;
      } else {
        toast({
          title: "Notifications denied",
          description: "You can enable notifications in your browser settings.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive"
      });
      return false;
    }
  };

  const scheduleNotificationCheck = async (tasks: any[], events: any[], dailyTasks: any[]) => {
    if (permission !== 'granted' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Store data in cache for service worker
      const cache = await caches.open('dashboard-data');
      await cache.put('/tasks', new Response(JSON.stringify(tasks)));
      await cache.put('/events', new Response(JSON.stringify(events)));
      await cache.put('/dailyTasks', new Response(JSON.stringify(dailyTasks)));
      
      // Schedule background sync
      if ('sync' in registration && 'sync' in window.navigator.serviceWorker) {
        await (registration as any).sync.register('check-tasks');
      }
    } catch (error) {
      console.error('Error scheduling notification check:', error);
    }
  };

  const showImmediateNotification = (title: string, body: string) => {
    if (permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    scheduleNotificationCheck,
    showImmediateNotification
  };
};