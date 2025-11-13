import { useNotifications } from '@/hooks/useNotifications';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Download, Smartphone, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export const NotificationSettings = () => {
  const { isSupported, permission, requestPermission, ensureSubscribed } = useNotifications();
  const { canInstall, isInstalled, isStandalone, isIOS, installApp } = usePWA();
  const [isSendingTest, setIsSendingTest] = useState(false);

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

      // Ensure we have a saved push subscription before testing
      await ensureSubscribed();

      const { data, error } = await supabase.functions.invoke('send-test-notification', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });
      
      if (error) {
        console.error('Error sending test notification:', error);
        toast({
          title: "Test failed",
          description: error.message || "Failed to send notification. Make sure you've enabled notifications.",
          variant: "destructive"
        });
      } else if (data?.error) {
        toast({
          title: "Test failed",
          description: data.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Test notification sent!",
          description: "You should receive a notification in a few seconds. If the app is open, you might need to close it to see the notification.",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive"
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
  if (shouldShowInstallPrompt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {isIOS ? 'Add to Home Screen' : 'Install App'}
          </CardTitle>
          <CardDescription>
            {isIOS 
              ? 'To receive notifications on iOS, add this app to your home screen using Safari\'s share menu.'
              : 'Install the app to your device to receive push notifications even when not browsing.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
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
      </Card>
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
    <div className="space-y-4">
      {/* Mobile Installation Status */}
      {(isIOS || navigator.userAgent.match(/Android/i)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile App Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isStandalone ? '✅ Installed as App' : '📱 Running in Browser'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isStandalone 
                    ? 'Perfect! You can receive notifications.'
                    : 'For best notification support, add to home screen.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get notified about your tasks and events even when you're not on the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
      </Card>
    </div>
  );
};