import { useNotifications } from '@/hooks/useNotifications';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Download, Smartphone, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { playCollapseSound, playExpandSound } from '@/lib/sounds';

export const NotificationSettings = () => {
  const { isSupported, permission, requestPermission, ensureSubscribed } = useNotifications();
  const { canInstall, isInstalled, isStandalone, isIOS, installApp } = usePWA();
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('notificationSettingsCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newValue = !prev;
      newValue ? playCollapseSound() : playExpandSound();
      try {
        localStorage.setItem('notificationSettingsCollapsed', String(newValue));
      } catch {}
      return newValue;
    });
  };
  const sendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to test notifications.",
          variant: "destructive"
        });
        return;
      }

      // Extra validation: clear stale/invalid sessions
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        await supabase.auth.signOut();
        toast({
          title: 'Session expired',
          description: 'Please sign in again, then try Send Test Notification.',
          variant: 'destructive',
        });
        return;
      }

      // Ensure permission is granted first
      if (permission !== 'granted') {
        toast({
          title: "Permission required",
          description: "Please allow notifications first.",
          variant: "destructive"
        });
        return;
      }

      // Force-save the current browser push subscription on the server
      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await (registration as any).pushManager.getSubscription();

        if (!subscription) {
          // Fetch VAPID key and create a new subscription if none exists
          const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
          if (vapidError || !vapidData?.publicKey) {
            throw new Error(vapidError?.message || 'Failed to fetch VAPID key');
          }
          const appServerKey = (function urlBase64ToUint8Array(base64String: string) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
            return outputArray;
          })(vapidData.publicKey);

          subscription = await (registration as any).pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey,
          });
        }

        const { error: saveError, data: saveData } = await supabase.functions.invoke('save-push-subscription', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { subscription: subscription.toJSON() },
        });
        if (saveError || (saveData as any)?.error) {
          throw new Error(saveError?.message || (saveData as any)?.error || 'Failed to save subscription');
        }
      } catch (saveErr) {
        console.error('Failed to ensure server subscription:', saveErr);
        toast({
          title: 'Subscription error',
          description: 'Could not save your device subscription. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Now send the test notification (JWT required by the function)
      const { data, error } = await supabase.functions.invoke('send-test-notification', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error('Error sending test notification:', error);
        toast({
          title: 'Test failed',
          description: error.message || "Failed to send notification. Make sure you've enabled notifications.",
          variant: 'destructive',
        });
      } else if (data?.error) {
        toast({
          title: 'Test failed',
          description: data.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Test notification sent!',
          description: 'You should receive a notification in a few seconds. If the app is open, you might need to close it to see the notification.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test notification.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Debug logging to see PWA hook values
  console.log('PWA Hook values:', { canInstall, isInstalled, isStandalone, isIOS });

  // For iOS Safari (not standalone), always show install prompt even if canInstall is false
  const shouldShowInstallPrompt = (canInstall && !isInstalled) || (isIOS && !isStandalone);
  
  console.log('shouldShowInstallPrompt:', shouldShowInstallPrompt);

  // Show install prompt for mobile devices or browsers that support installation
  const [isInstallCollapsed, setIsInstallCollapsed] = useState(() => {
    try {
      return localStorage.getItem('installSectionCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleInstallCollapse = () => {
    setIsInstallCollapsed(prev => {
      const newValue = !prev;
      newValue ? playCollapseSound() : playExpandSound();
      try {
        localStorage.setItem('installSectionCollapsed', String(newValue));
      } catch {}
      return newValue;
    });
  };

  if (shouldShowInstallPrompt) {
    return (
      <Collapsible open={!isInstallCollapsed} onOpenChange={() => toggleInstallCollapse()}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {isIOS ? 'Add to Home Screen' : 'Install App'}
                </div>
                {isInstallCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </CardTitle>
              {isInstallCollapsed && (
                <CardDescription>
                  Tap to expand for installation instructions
                </CardDescription>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <CardDescription className="mb-4">
                {isIOS 
                  ? 'To receive notifications on iOS, add this app to your home screen using Safari\'s share menu.'
                  : 'Install the app to your device to receive push notifications even when not browsing.'
                }
              </CardDescription>
              <div className="space-y-4">
                {isIOS ? (
                  <div className="space-y-2">
                    <p className="text-sm">To enable notifications on iOS:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Open this page in Safari (not Chrome/Firefox)</li>
                      <li>Tap the share button at the bottom</li>
                      <li>Select "Add to Home Screen"</li>
                      <li>Open the app from your home screen</li>
                      <li>Allow notifications when prompted</li>
                    </ol>
                  </div>
                ) : (
                  <Button onClick={installApp} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Install App
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Not Available
          </CardTitle>
          <CardDescription>
            {isIOS 
              ? 'On iOS, notifications only work when the app is added to your home screen. Use Safari\'s share menu to "Add to Home Screen" first, then open the app from your home screen to enable notifications.'
              : 'Your browser doesn\'t support push notifications.'
            }
          </CardDescription>
        </CardHeader>
        {isIOS && (
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">To enable notifications on iOS:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open this page in Safari (required for iOS)</li>
                <li>Tap the share button (box with arrow)</li>
                <li>Select "Add to Home Screen"</li>
                <li>Open the app from your home screen</li>
                <li>Allow notifications when prompted</li>
              </ol>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => toggleCollapse()}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push Notifications
              </div>
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </CardTitle>
            {isCollapsed && (
              <CardDescription>
                {permission === 'granted' ? '✅ Enabled' : permission === 'denied' ? '❌ Disabled' : '⏳ Not set'}
              </CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Mobile Installation Status */}
              {(isIOS || navigator.userAgent.match(/Android/i)) && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="h-4 w-4" />
                    <p className="text-sm font-medium">
                      {isStandalone ? '✅ Installed as App' : '📱 Running in Browser'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isStandalone 
                      ? 'Perfect! You can receive notifications.'
                      : 'For best notification support, add to home screen.'
                    }
                  </p>
                </div>
              )}

              <CardDescription>
                Get notified about your tasks and events even when you're not on the website.
              </CardDescription>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Status: {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Disabled' : 'Not set'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {permission === 'granted' 
                      ? 'You\'ll receive notifications about today\'s tasks and events'
                      : permission === 'denied'
                      ? 'Notifications are blocked. Enable them in your browser settings.'
                      : 'Click to enable notifications'
                    }
                  </p>
                </div>
                {permission !== 'granted' && permission !== 'denied' && (
                  <Button onClick={requestPermission} size="sm">
                    Enable Notifications
                  </Button>
                )}
              </div>
              
              {/* Test Notification Button */}
              {permission === 'granted' && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={sendTestNotification} 
                    size="sm" 
                    variant="outline"
                    disabled={isSendingTest}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSendingTest ? 'Sending...' : 'Send Test Notification'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    This simulates tomorrow's 8:00 AM notification. Close the website after clicking to test.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};