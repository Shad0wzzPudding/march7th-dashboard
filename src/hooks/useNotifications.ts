import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    try {
      // Check each condition individually for better debugging
      const hasNotification = 'Notification' in window;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const basicSupport = hasNotification && hasServiceWorker;
      
      // Enhanced iOS detection for all iOS devices and Safari
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                   /Safari/.test(userAgent) && /Mobile/.test(userAgent) ||
                   /iPhone OS|iOS/.test(userAgent) ||
                   /Macintosh/.test(userAgent) && 'ontouchend' in document;
      
      const standaloneCheck1 = window.matchMedia('(display-mode: standalone)').matches;
      const standaloneCheck2 = (window.navigator as any).standalone === true;
      const isStandalone = standaloneCheck1 || standaloneCheck2;
      
      // Individual logging for debugging (keeping for now)
      console.log('=== NOTIFICATION DEBUG START ===');
      console.log('hasNotification:', hasNotification);
      console.log('hasServiceWorker:', hasServiceWorker);
      console.log('basicSupport:', basicSupport);
      console.log('userAgent:', userAgent);
      console.log('isIOS:', isIOS);
      console.log('standaloneCheck1:', standaloneCheck1);
      console.log('standaloneCheck2:', standaloneCheck2);
      console.log('isStandalone:', isStandalone);
      console.log('=== NOTIFICATION DEBUG END ===');
      
      // Safari on iOS has very limited notification support
      // Notifications only work when:
      // 1. App is installed as PWA (added to home screen)
      // 2. Running in standalone mode
      // 3. User has granted permission
      if (isIOS) {
        if (isStandalone && hasNotification) {
          console.log('iOS PWA with notification support');
          setIsSupported(true);
          setPermission(Notification.permission);
        } else {
          console.log('iOS Safari - notifications not supported unless installed as PWA');
          setIsSupported(false);
        }
      } else if (basicSupport) {
        console.log('Setting isSupported to true: basic support available');
        setIsSupported(true);
        const currentPermission = Notification.permission;
        console.log('Current permission:', currentPermission);
        setPermission(currentPermission);
      } else {
        console.log('Setting isSupported to false: no basic support');
        setIsSupported(false);
      }
    } catch (error) {
      console.error('Error in notification detection:', error);
      setIsSupported(false);
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