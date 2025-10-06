import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  // Ensure push subscription exists when permission is already granted
  useEffect(() => {
    try {
      if (!isSupported) return;
      if (Notification.permission === 'granted') {
        // This is idempotent: it won't duplicate browser subscriptions
        // and will upsert the record in the database.
        subscribeToPushNotifications().catch((err) => {
          console.error('Auto-subscribe failed:', err);
        });
      }
    } catch (e) {
      console.error('Error ensuring push subscription:', e);
    }
  }, [isSupported]);

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const existingSubscription = await registration.pushManager.getSubscription();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (existingSubscription && currentUser) {
        // Ensure the subscription is saved in DB as well (idempotent)
        await supabase
          .from('push_subscriptions')
          .upsert([
            {
              user_id: currentUser.id,
              subscription: existingSubscription.toJSON() as any,
            },
          ], { onConflict: 'user_id' });
        console.log('Already subscribed to push notifications (DB upserted)');
        return existingSubscription;
      }
      
      // Fetch VAPID public key from edge function
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
      
      if (vapidError || !vapidData?.publicKey) {
        console.error('Error fetching VAPID key:', vapidError);
        toast({
          title: "Configuration Error",
          description: "Unable to set up push notifications. Please contact support.",
          variant: "destructive"
        });
        throw new Error('Failed to fetch VAPID key');
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey)
      });
      
      // Store subscription in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert([{
            user_id: user.id,
            subscription: subscription.toJSON() as any
          }], {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.error('Error storing push subscription:', error);
        } else {
          toast({
            title: "Success",
            description: "Push notifications enabled! You'll receive daily reminders at 8:00 AM.",
          });
        }
      }
      
      console.log('Push notification subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  };

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
        // Subscribe to push notifications
        await subscribeToPushNotifications();
        
        toast({
          title: "Notifications enabled",
          description: "You'll receive daily reminders about your tasks and events."
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
      
      // Schedule background sync (avoid duplicate tags)
      const regAny = registration as any;
      if ('sync' in regAny) {
        try {
          const tags = regAny.sync.getTags ? await regAny.sync.getTags() : [];
          if (!tags || !tags.includes('check-tasks')) {
            await regAny.sync.register('check-tasks');
          } else {
            console.log('[Notifications] Background sync already registered');
          }
        } catch (e) {
          console.warn('Background Sync tag check failed, attempting register once', e);
          try { await regAny.sync.register('check-tasks'); } catch {}
        }
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

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}