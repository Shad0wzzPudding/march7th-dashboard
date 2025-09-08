import { useNotifications } from '@/hooks/useNotifications';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Download, Smartphone } from 'lucide-react';

export const NotificationSettings = () => {
  const { isSupported, permission, requestPermission } = useNotifications();
  const { canInstall, isInstalled, isStandalone, isIOS, installApp } = usePWA();

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};